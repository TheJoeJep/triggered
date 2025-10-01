"use client";

import { create } from "zustand";

type SelectedOrgState = {
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
};

export const useSelectedOrg = create<SelectedOrgState>((set) => ({
  selectedOrgId: null,
  setSelectedOrgId: (id) => set({ selectedOrgId: id }),
}));
