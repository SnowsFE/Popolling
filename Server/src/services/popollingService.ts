import { Popolling } from "../models/popolling";

let popollings: Popolling[] = [];
let currentId = 1;

export const addPopolling = (data: Omit<Popolling, "id">): Popolling => {
  const newPopolling: Popolling = { id: currentId++, ...data };
  popollings.push(newPopolling);
  return newPopolling;
};

export const getAllPopollings = (): Popolling[] => popollings;

export const getPopollingById = (id: number): Popolling | undefined =>
  popollings.find((p) => p.id === id);

export const updatePopolling = (
  id: number,
  data: Partial<Omit<Popolling, "id">>
): Popolling | null => {
  const popolling = popollings.find((p) => p.id === id);
  if (!popolling) return null;

  Object.assign(popolling, data);
  return popolling;
};

export const deletePopolling = (id: number): boolean => {
  const initialLength = popollings.length;
  popollings = popollings.filter((p) => p.id !== id);
  return popollings.length < initialLength;
};
