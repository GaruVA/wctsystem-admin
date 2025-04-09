// Types for collector management

export interface Collector {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status: 'active' | 'on-leave' | 'inactive';
  area?: {
    _id: string;
    name: string;
  };
  efficiency?: number; // Collection efficiency percentage
  currentLocation?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  lastActive?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CollectorFormData {
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  areaId?: string;
  status?: 'active' | 'on-leave' | 'inactive';
}

export interface CollectorUpdateData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  area?: string;
  status?: 'active' | 'on-leave' | 'inactive';
  efficiency?: number;
}

export interface AreaAssignment {
  collectorId: string;
  areaId: string;
}

export interface StatusUpdate {
  status: 'active' | 'on-leave' | 'inactive';
}