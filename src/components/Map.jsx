import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { scoreToPercentage } from '../utils/scoring';

// Sage palette tints — dark for top picks, sage-deep for mid, light for low.
function getMarkerColor(score) {
  if (score < 60) return '#d6e0d9';   // sageLight (subtle)
  if (score < 80) return '#86a192';   // sage (mid)
  return '#4f6b5c';                    // sageDeep (top)
}

function shopsToGeoJSON(shops) {
  return {
    type: 'FeatureCollection',
    features: shops.map((shop) => {
      const pct = scoreToPercentage(shop.compositeScore);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [shop.lng, shop.lat] },
        properties: {
          id: shop.id,
          name: shop.name,
          neighborhood: shop.neighborhood,
          score: pct,
          color: getMarkerColor(pct),
          scaScore: shop.scaScore,
          googleRating: shop.googleRating,
        },
      };
    }),
  };
}

export function Map({ shops, userLocation, selectedShop, onSelectShop }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(null);
  const userMarker = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  // Initialize map once
  useEffect(() => {
    if (map.current || !token || !mapContainer.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
    });

    map.current.on('load', () => {
      // Shop source with clustering
      map.current.addSource('shops', {
        type: 'geojson',
        data: shopsToGeoJSON(shops),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 50,
      });

      // Cluster circles — sage deep
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'shops',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#4f6b5c',
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Cluster count labels
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'shops',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 13,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Individual shop markers
      map.current.addLayer({
        id: 'shop-markers',
        type: 'circle',
        source: 'shops',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'score'],
            50, 7,
            70, 9,
            90, 11,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': [
            'interpolate', ['linear'], ['get', 'score'],
            50, 0.7,
            90, 1,
          ],
        },
      });

      // Selected shop highlight ring
      map.current.addLayer({
        id: 'shop-selected',
        type: 'circle',
        source: 'shops',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-color': 'transparent',
          'circle-radius': 16,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#2d3a33',
        },
      });

      // Click on cluster -> zoom in
      map.current.on('click', 'clusters', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.current.getSource('shops').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.current.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });

      // Click on shop marker -> select
      map.current.on('click', 'shop-markers', (e) => {
        const feature = e.features[0];
        onSelectShop(feature.properties.id);
      });

      // Hover on shop marker -> show popup
      map.current.on('mouseenter', 'shop-markers', (e) => {
        map.current.getCanvas().style.cursor = 'pointer';
        const feature = e.features[0];
        const coords = feature.geometry.coordinates.slice();
        const { name, score, neighborhood } = feature.properties;
        popup.current
          .setLngLat(coords)
          .setHTML(
            `<div style="font-family:Inter,system-ui;padding:2px 0;color:#2d3a33">` +
            `<strong style="font-size:14px;font-weight:500">${name}</strong><br/>` +
            `<span style="color:#5d6b64;font-size:12px">${neighborhood}</span><br/>` +
            `<span style="font-size:12px;font-weight:600;color:#4f6b5c">Match ${score}</span>` +
            `</div>`
          )
          .addTo(map.current);
      });

      map.current.on('mouseleave', 'shop-markers', () => {
        map.current.getCanvas().style.cursor = '';
        popup.current.remove();
      });

      // Cursor pointer on clusters
      map.current.on('mouseenter', 'clusters', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        map.current.getCanvas().style.cursor = '';
      });

      // Mark map as loaded so marker-creation effect can run.
      // (Marker itself is created in its own effect so it picks up the
      // real geolocation even when 'load' fires after geolocation resolves,
      // which is common on mobile.)
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [token]);

  // Update shop data when shops change (filtering)
  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource('shops');
    if (source) {
      source.setData(shopsToGeoJSON(shops));
    }
  }, [shops]);

  // Create or update the user location marker once the map is loaded.
  // Kept separate from the 'load' callback so we always read the *current*
  // userLocation — on mobile, map 'load' can fire after geolocation
  // resolves, and a closure-captured value would freeze the marker at the
  // London fallback.
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    if (!userMarker.current) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
  }, [mapLoaded, userLocation.lat, userLocation.lng]);

  // Fly the map to the real user location once geolocation resolves
  // (map inits centered on the London fallback). Only once per session.
  const hasCenteredOnUser = useRef(false);
  useEffect(() => {
    if (
      !mapLoaded ||
      !map.current ||
      userLocation.loading ||
      userLocation.error ||
      hasCenteredOnUser.current
    ) {
      return;
    }
    hasCenteredOnUser.current = true;
    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 13,
      duration: 1200,
      essential: true,
    });
  }, [mapLoaded, userLocation.lat, userLocation.lng, userLocation.loading, userLocation.error]);

  // Fly to selected shop + highlight ring
  const flyToShop = useCallback((shopId) => {
    if (!map.current || !shopId) return;
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return;
    map.current.easeTo({
      center: [shop.lng, shop.lat],
      zoom: Math.max(map.current.getZoom(), 14),
      duration: 800,
    });
  }, [shops]);

  useEffect(() => {
    if (!map.current) return;

    // Update highlight filter
    if (map.current.getLayer('shop-selected')) {
      map.current.setFilter('shop-selected', [
        '==', ['get', 'id'], selectedShop || '',
      ]);
    }

    if (selectedShop) {
      flyToShop(selectedShop);
    }
  }, [selectedShop, flyToShop]);

  // Resize map when container becomes visible (mobile toggle)
  useEffect(() => {
    if (!map.current) return;
    const timer = setTimeout(() => map.current.resize(), 100);
    return () => clearTimeout(timer);
  });

  if (!token) {
    return (
      <div className="relative w-full h-full bg-bg flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="text-2xl font-medium text-ink mb-3">Map requires a token</h2>
          <p className="text-inkSoft mb-4">
            Add your Mapbox token to{' '}
            <code className="bg-sageLight px-2 py-1 rounded text-sm text-ink">.env.local</code>
          </p>
          <pre className="bg-ink text-sageLight text-xs p-3 rounded text-left mb-4">
            VITE_MAPBOX_TOKEN=pk_your_token
          </pre>
          <p className="text-sm text-inkSoft">
            Get a free token at{' '}
            <a href="https://account.mapbox.com" className="text-sageDeep hover:underline">
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full" />;
}

export default Map;
