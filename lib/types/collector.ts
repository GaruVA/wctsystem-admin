// Types for collector management

export interface Collector {
  _id: string;
  username: string;
  email: string;
  area?: string;
  currentLocation?: [number, number]; // [longitude, latitude]
}

export interface CollectorFormData {
  username: string;
  password: string;
  email: string;
  areaId?: string;
}

export interface CollectorUpdateData {
  username?: string;
  email?: string;
  area?: string;
}

export interface AreaAssignment {
  collectorId: string;
  areaId: string;
}