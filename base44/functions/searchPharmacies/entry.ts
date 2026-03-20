import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchType, searchValue, latitude, longitude } = await req.json();
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      return Response.json({ error: 'Google Places API key not configured' }, { status: 500 });
    }

    let searchQuery = '';
    let location = '';

    if (searchType === 'near' && latitude && longitude) {
      // Search near coordinates
      location = `${latitude},${longitude}`;
      searchQuery = 'pharmacy';
    } else if (searchType === 'search' && searchValue) {
      // Search by city, state, or zip
      searchQuery = `pharmacy in ${searchValue}`;
    } else {
      // Default search
      searchQuery = 'pharmacy';
    }

    // Use Google Places Text Search API
    const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    placesUrl.searchParams.set('query', searchQuery);
    if (location) {
      placesUrl.searchParams.set('location', location);
      placesUrl.searchParams.set('radius', '8000'); // 5 miles in meters
    }
    placesUrl.searchParams.set('type', 'pharmacy');
    placesUrl.searchParams.set('key', apiKey);

    const placesResponse = await fetch(placesUrl.toString());
    const placesData = await placesResponse.json();

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      return Response.json({ 
        error: `Google Places API error: ${placesData.status}`,
        details: placesData.error_message 
      }, { status: 500 });
    }

    // Transform results to pharmacy format
    const pharmacies = (placesData.results || []).slice(0, 8).map(place => {
      const name = place.name;
      const address = place.formatted_address || place.vicinity || '';
      
      // Extract address components
      const addressParts = address.split(',').map(s => s.trim());
      const street = addressParts[0] || '';
      const city = addressParts[1] || '';
      const stateZip = addressParts[2] || '';
      
      // Determine chain type from name
      let chain = 'INDEP';
      let chainClass = 'chain-wm';
      if (name.toLowerCase().includes('cvs')) {
        chain = 'CVS';
        chainClass = 'chain-cvs';
      } else if (name.toLowerCase().includes('walgreens')) {
        chain = 'WAG';
        chainClass = 'chain-wag';
      } else if (name.toLowerCase().includes('walmart')) {
        chain = 'WM';
        chainClass = 'chain-wm';
      } else if (name.toLowerCase().includes('hospital') || name.toLowerCase().includes('medical center')) {
        chain = 'HOSP';
        chainClass = 'chain-hosp';
      }

      // Calculate distance if we have user location
      let distance = '';
      if (latitude && longitude && place.geometry?.location) {
        const lat1 = latitude;
        const lon1 = longitude;
        const lat2 = place.geometry.location.lat;
        const lon2 = place.geometry.location.lng;
        
        // Haversine formula
        const R = 3959; // Earth radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;
        distance = `${d.toFixed(1)} mi`;
      }

      // Determine hours
      let hours = 'Call for hours';
      if (place.opening_hours?.open_now === true) {
        hours = place.opening_hours?.weekday_text?.[0] || 'Open now';
      } else if (place.opening_hours?.open_now === false) {
        hours = 'Currently closed';
      }

      return {
        name: name,
        addr: `${street}${distance ? ' · ' + distance : ''}${hours !== 'Call for hours' ? ' · ' + hours : ''}`,
        chain: chain,
        chainClass: chainClass,
        fullData: {
          name: name,
          address: street,
          city: city,
          state: stateZip.split(' ')[0] || '',
          zip: stateZip.split(' ').slice(1).join(' ') || '',
          distance: distance,
          hours: hours,
          phone: place.formatted_phone_number || '',
          rating: place.rating || 0,
          placeId: place.place_id,
          latitude: place.geometry?.location?.lat || null,
          longitude: place.geometry?.location?.lng || null
        }
      };
    });

    return Response.json({ 
      success: true,
      pharmacies: pharmacies,
      count: pharmacies.length
    });

  } catch (error) {
    console.error('Error searching pharmacies:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});