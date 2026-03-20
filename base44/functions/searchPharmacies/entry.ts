import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { LocationClient, SearchPlaceIndexForTextCommand } from 'npm:@aws-sdk/client-location@3.621.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchType, searchValue, latitude, longitude } = await req.json();
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const region = Deno.env.get('AWS_REGION') || 'us-east-1';
    const placeIndexName = Deno.env.get('AWS_PLACE_INDEX_NAME') || 'MyPlaceIndex';

    if (!accessKeyId || !secretAccessKey) {
      return Response.json({ error: 'AWS credentials not configured' }, { status: 500 });
    }

    // Initialize AWS Location client
    const locationClient = new LocationClient({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    let searchQuery = '';
    let biasPosition = undefined;

    if (searchType === 'near' && latitude && longitude) {
      searchQuery = 'pharmacy';
      biasPosition = [longitude, latitude]; // AWS uses [lng, lat] format
    } else if (searchType === 'search' && searchValue) {
      searchQuery = `pharmacy ${searchValue}`;
    } else {
      searchQuery = 'pharmacy';
    }

    // Search using Amazon Location Service
    const command = new SearchPlaceIndexForTextCommand({
      IndexName: placeIndexName,
      Text: searchQuery,
      MaxResults: 8,
      BiasPosition: biasPosition,
    });

    const response = await locationClient.send(command);
    const results = response.Results || [];

    // Transform results to pharmacy format
    const pharmacies = results.map(result => {
      const place = result.Place;
      const name = place.Label || 'Pharmacy';
      const address = place.AddressNumber ? `${place.AddressNumber} ${place.Street || ''}`.trim() : (place.Street || '');
      const city = place.Municipality || '';
      const state = place.Region || '';
      const zip = place.PostalCode || '';
      
      // Determine chain type from name
      let chain = 'INDEP';
      let chainClass = 'chain-wm';
      const nameLower = name.toLowerCase();
      if (nameLower.includes('cvs')) {
        chain = 'CVS';
        chainClass = 'chain-cvs';
      } else if (nameLower.includes('walgreens')) {
        chain = 'WAG';
        chainClass = 'chain-wag';
      } else if (nameLower.includes('walmart')) {
        chain = 'WM';
        chainClass = 'chain-wm';
      } else if (nameLower.includes('hospital') || nameLower.includes('medical center')) {
        chain = 'HOSP';
        chainClass = 'chain-hosp';
      }

      // Calculate distance if we have user location
      let distance = '';
      if (latitude && longitude && place.Geometry?.Point) {
        const [placeLng, placeLat] = place.Geometry.Point;
        
        // Haversine formula
        const R = 3959; // Earth radius in miles
        const dLat = (placeLat - latitude) * Math.PI / 180;
        const dLon = (placeLng - longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(latitude * Math.PI / 180) * Math.cos(placeLat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;
        distance = `${d.toFixed(1)} mi`;
      }

      return {
        name: name,
        addr: `${address}${city ? ', ' + city : ''}${state ? ', ' + state : ''}${zip ? ' ' + zip : ''}${distance ? ' · ' + distance : ''}`,
        chain: chain,
        chainClass: chainClass,
        fullData: {
          name: name,
          address: address,
          city: city,
          state: state,
          zip: zip,
          distance: distance,
          hours: 'Call for hours',
          phone: '',
          latitude: place.Geometry?.Point?.[1] || null,
          longitude: place.Geometry?.Point?.[0] || null,
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