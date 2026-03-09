import { CalcParams } from './types';

export const VERSION = "10.0";

export const DEFAULT_PARAMS: CalcParams = {
  f1: 2,
  f2: 5.60,
  f3: 0.82,
  markupCrt: 1.35,
  markupRol: 1.30,
  div18: 0.7235,
  div12: 0.7835,
  div7: 0.8335,
  divCT: 0.9
};

export const MATERIAL_HIERARCHY = [
  "INOX 316",
  "INOX 304",
  "INOX 302",
  "GALVANIZADO",
  "AÇO CARBONO"
];

export const MATERIAL_COLORS: Record<string, string> = {
  "INOX 316": "bg-purple-100",
  "INOX 304": "bg-blue-100",
  "INOX 302": "bg-green-100",
  "GALVANIZADO": "bg-yellow-100",
  "AÇO CARBONO": "bg-gray-200"
};
