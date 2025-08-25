import { Request, Response } from "express";
import {
  addPopolling,
  getAllPopollings,
  getPopollingById,
  updatePopolling,
  deletePopolling,
} from "../services/popollingService";

export const getPopollings = (req: Request, res: Response) => {
  res.json(getAllPopollings());
};

export const createPopolling = (req: Request, res: Response) => {
  const newPopolling = addPopolling(req.body);
  res.json(newPopolling);
};

export const getPopolling = (req: Request, res: Response) => {
  const popolling = getPopollingById(Number(req.params.id));
  if (!popolling)
    return res.status(404).json({ message: "Popolling not found" });
  res.json(popolling);
};

export const editPopolling = (req: Request, res: Response) => {
  const updated = updatePopolling(Number(req.params.id), req.body);
  if (!updated) return res.status(404).json({ message: "Popolling not found" });
  res.json(updated);
};

export const removePopolling = (req: Request, res: Response) => {
  const deleted = deletePopolling(Number(req.params.id));
  if (!deleted) return res.status(404).json({ message: "Popolling not found" });
  res.json({ message: "Popolling deleted" });
};
