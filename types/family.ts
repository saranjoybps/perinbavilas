export interface Child {
  code: string;
  name: string;
  dob: string | null;
  dod?: string | null;
}

export interface Spouse {
  name: string;
  dob: string | null;
  dod: string | null;
}

export interface FamilyMember {
  code: string;
  name: string;
  dob: string | null;
  dod: string | null;
  spouse: Spouse;
  spouses?: Spouse[];
  family_name: string | null;
  address: string | null;
  cell_numbers: string[];
  landline: string | null;
  email: string | null;
  occupation: string | null;
  photos: string[];
  children: Child[];
}

export interface FamilyRecord extends FamilyMember {
  _sourceFile: string;
  _fileOrder: number;
  _editedAt?: string;
}

export interface DashboardStats {
  totalFamilies: number;
  totalChildren: number;
  totalImages: number;
  dataSource: string;
}

export type SortField = 'file' | 'code' | 'name' | 'dob';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  search: string;
  hasPhotos: boolean | null;
  hasSpouse: boolean | null;
  childrenCountMin: number | null;
  childrenCountMax: number | null;
  sortField: SortField;
  sortOrder: SortOrder;
}
