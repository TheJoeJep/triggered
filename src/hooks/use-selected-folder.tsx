"use client";

import { create } from "zustand";

type SelectedFolderState = {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
};

export const useSelectedFolder = create<SelectedFolderState>((set) => ({
  selectedFolderId: null,
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
}));
