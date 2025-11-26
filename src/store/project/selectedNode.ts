import { create } from "zustand";

interface SelectedNodeState {
	nodeId: string | null;
	setNodeId: (id: string | null) => void;
}

export const useSelectedNodeStore = create<SelectedNodeState>((set) => ({
	nodeId: null,
	setNodeId: (id) => set({ nodeId: id }),
}));
