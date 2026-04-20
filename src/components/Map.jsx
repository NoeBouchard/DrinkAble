import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { scoreToPercentage } from '../utils/scoring';

function getMarkerColor(score) {
  if (score < 60) return '#ef4444';
  if (score < 80) return '#eab308';
  return '#22c55e';
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

      // Cluster circles
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'shops',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#4a3a28',
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
          'circle-stroke-color': '#4a3a28',
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
            `<div style="font-family:system-ui;padding:2px 0">` +
            `<strong style="font-size:14px">${name}</strong><br/>` +
            `<span style="color:#666;font-size:12px">${neighborhood}</span><br/>` +
            `<span style="font-size:12px;font-weight:600;color:${getMarkerColor(score)}">Score: ${score}</span>` +
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

      // User location marker
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
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

  // Update user location marker + re-center map on the real location
  // once geolocation resolves (map inits with the London fallback).
  const hasCenteredOnUser = useRef(false);
  useEffect(() => {
    if (userMarker.current) {
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
    if (
      map.current &&
      !userLocation.loading &&
      !userLocation.error &&
      !hasCenteredOnUser.current
    ) {
      hasCenteredOnUser.current = true;
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 13,
        duration: 1200,
        essential: true,
      });
    }
  }, [userLocation.lat, userLocation.lng, userLocation.loading, userLocation.error]);

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
      <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">&#x1f5fa;&#xfe0f;</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Map requires a token</h2>
          <p className="text-gray-600 mb-4">
            Add your Mapbox token to{' '}
            <code className="bg-gray-200 px-2 py-1 rounded text-sm">.env.local</code>
          </p>
          <pre className="bg-gray-800 text-green-400 text-xs p-3 rounded text-left mb-4">
            VITE_MAPBOX_TOKEN=pk_your_token
          </pre>
          <p className="text-sm text-gray-500">
            Get a free token at{' '}
            <a href="https://account.mapbox.com" className="text-blue-600 hover:underline">
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
