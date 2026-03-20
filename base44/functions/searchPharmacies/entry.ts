import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { LocationClient, SearchPlaceIndexForTextCommand } from 'npm:@aws-sdk/client-location@3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchType, searchValue, latitude, longitude } = await req.json();
    const region = Deno.env.get('AWS_REGION') || 'us-east-1';
    const placeIndexName = Deno.env.get('AWS_PLACE_INDEX_NAME') || 'MyPlaceIndex';
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      return Response.json({ error: 'AWS credentials not configured' }, { status: 500 });
    }

    const client = new LocationClient({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    let queryText = '';
    let biasPosition = undefined;

    if (searchType === 'near' && latitude && longitude) {
      queryText = 'pharmacy';
      biasPosition = [longitude, latitude];
    } else if (searchType === 'search' && searchValue) {
      queryText = `pharmacy ${searchValue}`;
    } else {
      queryText = 'pharmacy';
    }

    const command = new SearchPlaceIndexForTextCommand({
      IndexName: placeIndexName,
      Text: queryText,
      MaxResults: 8,
      BiasPosition: biasPosition,
    });

    const data = await client.send(command);
    const results = data.Results || [];

    // Transform results to pharmacy format
    const pharmacies = results.map(result => {
      const place = result.Place;
      const name = place.Title || place.Label || 'Pharmacy';
      const address = place.Address || '';
      const addressNumber = place.AddressNumber || '';
      const street = place.Street || '';
      const city = place.Municipality || place.Locality || '';
      const state = place.Region || '';
      const zip = place.PostalCode || '';
      
      const fullAddress = addressNumber && street ? `${addressNumber} ${street}`.trim() : (street || address);
      
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
      const placePosition = place.Position || place.Geometry?.Point;
      if (latitude && longitude && placePosition) {
        const [placeLng, placeLat] = placePosition;
        
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
        addr: `${fullAddress}${city ? ', ' + city : ''}${state ? ', ' + state : ''}${zip ? ' ' + zip : ''}${distance ? ' · ' + distance : ''}`,
        chain: chain,
        chainClass: chainClass,
        fullData: {
          name: name,
          address: fullAddress,
          city: city,
          state: state,
          zip: zip,
          distance: distance,
          hours: 'Call for hours',
          phone: '',
          latitude: placePosition?.[1] || null,
          longitude: placePosition?.[0] || null,
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