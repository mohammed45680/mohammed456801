export interface SparePart {
  id: string;
  name: string;
  category: string;
  size: number; // in mm
  compatibilityGroup: string;
  price: number;
  image: string;
  description: string;
  tags: string[];
}

export interface AssemblySlot {
  id: string;
  requiredSize: number;
  allowedCategory: string;
  currentPart?: SparePart;
}

export interface AssemblyConfig {
  id: string;
  name: string;
  slots: AssemblySlot[];
}

export interface MarketItem {
  id: string;
  name: string;
  parts: SparePart[];
  totalPrice: number;
  date: string;
  image: string;
}

export interface Distributor {
  id: string;
  name: string;
  branchLocation: string;
  phoneNumber: string;
  email: string;
  marketingMethod: string;
  deliveryMethod: string;
  paymentType: string;
}
