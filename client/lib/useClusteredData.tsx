// client\lib\useClusteredData.tsx

import { useState, useEffect, useMemo } from 'react';
import Supercluster, { type PointFeature } from 'supercluster';


// Define the shape of the clustered output data item
interface ClusteredDataItem {
  message: string[];
  longitude: number;
  latitude: number;
}

interface SuperclusterPointProperties {
  message: string; 
}

/**
 * Cluster geographic data using Supercluster.
 * It takes raw data and returns clustered data suitable for rendering on a map/globe.
 *
 * @param rawData The array of raw data points { message, longitude, latitude }.
 * @param zoomLevel A number representing the current zoom level (e.g., derived from globe altitude).
 * @param clusterRadius The radius in pixels for clustering. Adjust based on your globe's scale and desired density.
 * @param maxClusterZoom The maximum zoom level at which clusters will be formed. Above this, all points are individual.
 * @returns An array of ClusteredDataItem, where each item might represent a single point or a cluster of points.
 */
export function useClusteredData(
  rawData: {
  message: string;
  longitude: number;
  latitude: number;
}[] | undefined,
  zoomLevel: number,
  clusterRadius = 1500,
  maxClusterZoom = 16,
): ClusteredDataItem[] {
  console.log('useClusteredData arguments: ',
    // '\n  rawData: ', rawData,
    '\n  zoomLevel: ', zoomLevel,
    // '\n  clusterRadius: ', clusterRadius,
    // '\n  maxClusterZoom: ', maxClusterZoom
  )

  const superclusterInstance = useMemo(() => {
    return new Supercluster<SuperclusterPointProperties>({
      radius: clusterRadius,
      maxZoom: maxClusterZoom,
    });
  }, [clusterRadius, maxClusterZoom]);

  // Prepare raw data into GeoJSON Feature format for Supercluster.
  const geoJsonFeatures = useMemo((): PointFeature<SuperclusterPointProperties>[] => {
    if (!rawData) {
      return [];
    }
    return rawData.map((item) => ({
      type: 'Feature',
      properties: { message: item.message },
      geometry: {
        type: 'Point',
        coordinates: [item.longitude, item.latitude], // Supercluster expects [lng, lat]
      },
    }));
  }, [rawData]);

  const [clusteredOutput, setClusteredOutput] = useState<ClusteredDataItem[]>(
    [],
  );

  // load data into Supercluster and then get clusters
  useEffect(() => {
    if (geoJsonFeatures.length > 0) {
      superclusterInstance.load(geoJsonFeatures);
    } else {
      superclusterInstance.load([]);
    }

    const clusters = superclusterInstance.getClusters(
      [-180, -90, 180, 90],
      Math.floor(zoomLevel),
    );

    const mappedClusters: ClusteredDataItem[] = clusters.map((cluster) => {
        console.log()
      if (cluster.properties.cluster) {
        const children = superclusterInstance.getLeaves(Number(cluster.id), Number.POSITIVE_INFINITY);
        const messages = children.map((child) => child.properties.message);
        return {
          message: messages,
          longitude: cluster.geometry.coordinates[0],
          latitude: cluster.geometry.coordinates[1],
        };
      }
      return {
        message: [cluster.properties.message],
        longitude: cluster.geometry.coordinates[0],
        latitude: cluster.geometry.coordinates[1],
      };
    });

    setClusteredOutput(mappedClusters);
  }, [geoJsonFeatures, superclusterInstance, zoomLevel]);

  return clusteredOutput;
}
