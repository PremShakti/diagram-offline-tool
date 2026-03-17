import { create } from "zustand";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Connection,
  type XYPosition,
  MarkerType,
} from "@xyflow/react";

const STORAGE_KEY = "diagram-editor-state";
const MAX_HISTORY = 50;

export const ICON_OPTIONS = [
  { id: "user", label: "User" },
  { id: "users", label: "Users" },
  { id: "laptop", label: "Laptop" },
  { id: "monitor", label: "Monitor" },
  { id: "server", label: "Server" },
  { id: "database", label: "Database" },
  { id: "cloud", label: "Cloud" },
  { id: "globe", label: "Globe" },
  { id: "shield", label: "Shield" },
  { id: "lock", label: "Lock" },
  { id: "wifi", label: "WiFi" },
  { id: "smartphone", label: "Phone" },
  { id: "hard-drive", label: "Storage" },
  { id: "cpu", label: "CPU" },
  { id: "mail", label: "Mail" },
  { id: "file-text", label: "File" },
  { id: "folder", label: "Folder" },
  { id: "settings", label: "Settings" },
  { id: "zap", label: "Zap" },
  { id: "activity", label: "Activity" },
] as const;

export type IconName = (typeof ICON_OPTIONS)[number]["id"];

export const NODE_COLORS = [
  { id: "default", bg: "hsl(0 0% 100%)", border: "hsl(220 12% 90%)", text: "hsl(220 15% 15%)" },
  { id: "blue", bg: "hsl(213 97% 96%)", border: "hsl(213 80% 78%)", text: "hsl(213 80% 30%)" },
  { id: "green", bg: "hsl(142 70% 95%)", border: "hsl(142 60% 70%)", text: "hsl(142 60% 25%)" },
  { id: "amber", bg: "hsl(40 95% 94%)", border: "hsl(40 85% 68%)", text: "hsl(40 80% 28%)" },
  { id: "rose", bg: "hsl(350 90% 96%)", border: "hsl(350 75% 75%)", text: "hsl(350 70% 30%)" },
  { id: "slate", bg: "hsl(220 15% 94%)", border: "hsl(220 12% 78%)", text: "hsl(220 15% 25%)" },
] as const;

export type NodeColorId = (typeof NODE_COLORS)[number]["id"];

export type DiagramNodeData = {
  label: string;
  nodeType: "text" | "rectangle" | "circle" | "code" | "icon";
  colorId?: NodeColorId;
  iconName?: IconName;
  [key: string]: unknown;
};

export type DiagramNode = Node<DiagramNodeData>;
export type DiagramEdge = Edge;

type HistoryEntry = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

interface DiagramState {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  snapToGrid: boolean;
  gridSize: number;
  selectedNodeIds: string[];

  past: HistoryEntry[];
  future: HistoryEntry[];

  onNodesChange: OnNodesChange<DiagramNode>;
  onEdgesChange: OnEdgesChange<DiagramEdge>;
  onConnect: OnConnect;

  addNode: (type: DiagramNodeData["nodeType"], position: XYPosition, iconName?: IconName) => void;
  updateNodeData: (nodeId: string, data: Partial<DiagramNodeData>) => void;
  deleteSelected: () => void;
  selectAll: () => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setNodeColor: (nodeId: string, colorId: NodeColorId) => void;
  duplicateSelected: () => void;

  copyNodes: () => DiagramNode[];
  pasteNodes: (copiedNodes: DiagramNode[], offset?: XYPosition) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  toggleSnapToGrid: () => void;
  moveSelectedNodes: (dx: number, dy: number) => void;
  alignNodes: (direction: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  clearCanvas: () => void;

  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;

  showShortcuts: boolean;
  toggleShortcuts: () => void;

  exportDiagramFile: () => void;
  importDiagramFile: () => void;
  loadDiagramData: (data: { nodes: DiagramNode[]; edges: DiagramEdge[] }) => void;
}

function loadFromStorage(): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  if (typeof window === "undefined") return { nodes: [], edges: [] };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { nodes: parsed.nodes || [], edges: parsed.edges || [] };
    }
  } catch {
    // ignore
  }
  return { nodes: [], edges: [] };
}

function saveToStorage(nodes: DiagramNode[], edges: DiagramEdge[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  } catch {
    // ignore
  }
}

let nodeIdCounter = Date.now();
function getNodeId() {
  return `node_${nodeIdCounter++}`;
}

function getDefaultNodeDimensions(type: DiagramNodeData["nodeType"]) {
  switch (type) {
    case "text":
      return { width: 200, height: 56 };
    case "rectangle":
      return { width: 180, height: 120 };
    case "circle":
      return { width: 140, height: 140 };
    case "code":
      return { width: 300, height: 160 };
    case "icon":
      return { width: 100, height: 110 };
  }
}

function getDefaultLabel(type: DiagramNodeData["nodeType"]) {
  switch (type) {
    case "text":
      return "Text";
    case "rectangle":
      return "";
    case "circle":
      return "";
    case "code":
      return "// code here";
    case "icon":
      return "";
  }
}

const EDGE_COLOR = "hsl(220 15% 60%)";

const initialData = loadFromStorage();

export const useDiagramStore = create<DiagramState>((set, get) => ({
  nodes: initialData.nodes,
  edges: initialData.edges,
  snapToGrid: false,
  gridSize: 20,
  selectedNodeIds: [],
  showShortcuts: false,
  toggleShortcuts: () => set((s) => ({ showShortcuts: !s.showShortcuts })),
  past: [],
  future: [],

  onNodesChange: (changes) => {
    const state = get();
    const hasPositionChange = changes.some(
      (c) => c.type === "position" && c.dragging === false
    );
    if (hasPositionChange) {
      state.pushHistory();
    }
    const newNodes = applyNodeChanges(changes, state.nodes);
    set({ nodes: newNodes });
    saveToStorage(newNodes, state.edges);
  },

  onEdgesChange: (changes) => {
    const state = get();
    const hasRemove = changes.some((c) => c.type === "remove");
    if (hasRemove) {
      state.pushHistory();
    }
    const newEdges = applyEdgeChanges(changes, state.edges);
    set({ edges: newEdges });
    saveToStorage(state.nodes, newEdges);
  },

  onConnect: (connection: Connection) => {
    const state = get();
    state.pushHistory();
    const newEdges = addEdge(
      {
        ...connection,
        type: "smoothstep",
        animated: false,
        style: { strokeWidth: 1.5, stroke: EDGE_COLOR },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: EDGE_COLOR,
          width: 20,
          height: 20,
        },
      },
      state.edges
    );
    set({ edges: newEdges });
    saveToStorage(state.nodes, newEdges);
  },

  addNode: (type, position, iconName) => {
    const state = get();
    state.pushHistory();
    const dims = getDefaultNodeDimensions(type);
    const icon = iconName || (type === "icon" ? "server" : undefined);
    const label = type === "icon"
      ? (ICON_OPTIONS.find((i) => i.id === icon)?.label || "")
      : getDefaultLabel(type);
    const newNode: DiagramNode = {
      id: getNodeId(),
      type: "diagram",
      position,
      style: { width: dims.width, height: dims.height },
      data: {
        label,
        nodeType: type,
        colorId: "default",
        ...(icon ? { iconName: icon } : {}),
      },
    };
    const newNodes = [...state.nodes, newNode];
    set({ nodes: newNodes });
    saveToStorage(newNodes, state.edges);
  },

  updateNodeData: (nodeId, data) => {
    const state = get();
    const newNodes = state.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
    );
    set({ nodes: newNodes });
    saveToStorage(newNodes, state.edges);
  },

  deleteSelected: () => {
    const state = get();
    const selectedNodes = state.nodes.filter((n) => n.selected);
    const selectedEdges = state.edges.filter((e) => e.selected);
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    state.pushHistory();
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const newNodes = state.nodes.filter((n) => !n.selected);
    const newEdges = state.edges.filter(
      (e) =>
        !e.selected &&
        !selectedNodeIds.has(e.source) &&
        !selectedNodeIds.has(e.target)
    );
    set({ nodes: newNodes, edges: newEdges, selectedNodeIds: [] });
    saveToStorage(newNodes, newEdges);
  },

  selectAll: () => {
    const state = get();
    const newNodes = state.nodes.map((n) => ({ ...n, selected: true }));
    set({ nodes: newNodes, selectedNodeIds: newNodes.map((n) => n.id) });
  },

  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

  setNodeColor: (nodeId, colorId) => {
    const state = get();
    state.pushHistory();
    const newNodes = state.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, colorId } } : n
    );
    set({ nodes: newNodes });
    saveToStorage(newNodes, state.edges);
  },

  duplicateSelected: () => {
    const state = get();
    const selected = state.nodes.filter((n) => n.selected);
    if (selected.length === 0) return;
    state.pushHistory();
    const idMap = new Map<string, string>();
    const newNodes = selected.map((n) => {
      const newId = getNodeId();
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + 30, y: n.position.y + 30 },
        selected: true,
      };
    });
    const deselectOld = state.nodes.map((n) => ({ ...n, selected: false }));
    const allNodes = [...deselectOld, ...newNodes];
    const copiedIds = new Set(selected.map((n) => n.id));
    const newEdges = state.edges
      .filter((e) => copiedIds.has(e.source) && copiedIds.has(e.target))
      .map((e) => ({
        ...e,
        id: `edge_${nodeIdCounter++}`,
        source: idMap.get(e.source) || e.source,
        target: idMap.get(e.target) || e.target,
      }));
    const allEdges = [...state.edges, ...newEdges];
    set({ nodes: allNodes, edges: allEdges });
    saveToStorage(allNodes, allEdges);
  },

  copyNodes: () => {
    return get().nodes.filter((n) => n.selected);
  },

  pasteNodes: (copiedNodes, offset = { x: 40, y: 40 }) => {
    const state = get();
    if (copiedNodes.length === 0) return;
    state.pushHistory();
    const idMap = new Map<string, string>();
    const newNodes = copiedNodes.map((n) => {
      const newId = getNodeId();
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        position: {
          x: n.position.x + offset.x,
          y: n.position.y + offset.y,
        },
        selected: true,
      };
    });
    const deselectOld = state.nodes.map((n) => ({ ...n, selected: false }));
    const allNodes = [...deselectOld, ...newNodes];
    const copiedIds = new Set(copiedNodes.map((n) => n.id));
    const newEdges = state.edges
      .filter((e) => copiedIds.has(e.source) && copiedIds.has(e.target))
      .map((e) => ({
        ...e,
        id: `edge_${nodeIdCounter++}`,
        source: idMap.get(e.source) || e.source,
        target: idMap.get(e.target) || e.target,
      }));
    const allEdges = [...state.edges, ...newEdges];
    set({ nodes: allNodes, edges: allEdges });
    saveToStorage(allNodes, allEdges);
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);
    set({
      past: newPast,
      future: [
        { nodes: state.nodes, edges: state.edges },
        ...state.future,
      ].slice(0, MAX_HISTORY),
      nodes: previous.nodes,
      edges: previous.edges,
    });
    saveToStorage(previous.nodes, previous.edges);
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    set({
      past: [
        ...state.past,
        { nodes: state.nodes, edges: state.edges },
      ].slice(-MAX_HISTORY),
      future: newFuture,
      nodes: next.nodes,
      edges: next.edges,
    });
    saveToStorage(next.nodes, next.edges);
  },

  pushHistory: () => {
    const state = get();
    set({
      past: [
        ...state.past,
        { nodes: state.nodes, edges: state.edges },
      ].slice(-MAX_HISTORY),
      future: [],
    });
  },

  toggleSnapToGrid: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }));
  },

  moveSelectedNodes: (dx, dy) => {
    const state = get();
    const selected = state.nodes.filter((n) => n.selected);
    if (selected.length === 0) return;
    const newNodes = state.nodes.map((n) =>
      n.selected
        ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
        : n
    );
    set({ nodes: newNodes });
    saveToStorage(newNodes, state.edges);
  },

  alignNodes: (direction) => {
    const state = get();
    const selected = state.nodes.filter((n) => n.selected);
    if (selected.length < 2) return;
    state.pushHistory();

    let newNodes = [...state.nodes];
    const positions = selected.map((n) => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
      w: n.measured?.width || (n.style?.width as number) || 180,
      h: n.measured?.height || (n.style?.height as number) || 100,
    }));

    switch (direction) {
      case "left": {
        const minX = Math.min(...positions.map((p) => p.x));
        newNodes = newNodes.map((n) =>
          n.selected ? { ...n, position: { ...n.position, x: minX } } : n
        );
        break;
      }
      case "center": {
        const centers = positions.map((p) => p.x + p.w / 2);
        const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
        newNodes = newNodes.map((n) => {
          if (!n.selected) return n;
          const w = n.measured?.width || (n.style?.width as number) || 180;
          return { ...n, position: { ...n.position, x: avgCenter - w / 2 } };
        });
        break;
      }
      case "right": {
        const maxRight = Math.max(...positions.map((p) => p.x + p.w));
        newNodes = newNodes.map((n) => {
          if (!n.selected) return n;
          const w = n.measured?.width || (n.style?.width as number) || 180;
          return { ...n, position: { ...n.position, x: maxRight - w } };
        });
        break;
      }
      case "top": {
        const minY = Math.min(...positions.map((p) => p.y));
        newNodes = newNodes.map((n) =>
          n.selected ? { ...n, position: { ...n.position, y: minY } } : n
        );
        break;
      }
      case "middle": {
        const middles = positions.map((p) => p.y + p.h / 2);
        const avgMiddle = middles.reduce((a, b) => a + b, 0) / middles.length;
        newNodes = newNodes.map((n) => {
          if (!n.selected) return n;
          const h = n.measured?.height || (n.style?.height as number) || 100;
          return { ...n, position: { ...n.position, y: avgMiddle - h / 2 } };
        });
        break;
      }
      case "bottom": {
        const maxBottom = Math.max(...positions.map((p) => p.y + p.h));
        newNodes = newNodes.map((n) => {
          if (!n.selected) return n;
          const h = n.measured?.height || (n.style?.height as number) || 100;
          return { ...n, position: { ...n.position, y: maxBottom - h } };
        });
        break;
      }
    }

    set({ nodes: newNodes });
    saveToStorage(newNodes, state.edges);
  },

  clearCanvas: () => {
    const state = get();
    if (state.nodes.length === 0 && state.edges.length === 0) return;
    state.pushHistory();
    set({ nodes: [], edges: [], selectedNodeIds: [] });
    saveToStorage([], []);
  },

  bringToFront: () => {
    const state = get();
    const selected = state.nodes.filter((n) => n.selected);
    if (selected.length === 0) return;
    state.pushHistory();
    const maxZ = Math.max(0, ...state.nodes.map((n) => n.zIndex ?? 0));
    const selectedIds = new Set(selected.map((n) => n.id));
    const newNodes = state.nodes.map((n) =>
      selectedIds.has(n.id) ? { ...n, zIndex: maxZ + 1 } : n
    );
    set({ nodes: newNodes });
    saveToStorage(newNodes, state.edges);
  },

  sendToBack: () => {
    const state = get();
    const selected = state.nodes.filter((n) => n.selected);
    if (selected.length === 0) return;
    state.pushHistory();
    const minZ = Math.min(0, ...state.nodes.map((n) => n.zIndex ?? 0));
    const selectedIds = new Set(selected.map((n) => n.id));
    const newNodes = state.nodes.map((n) =>
      selectedIds.has(n.id) ? { ...n, zIndex: minZ - 1 } : n
    );
    set({ nodes: newNodes });
    saveToStorage(newNodes, state.edges);
  },

  bringForward: () => {
    const state = get();
    const selected = state.nodes.filter((n) => n.selected);
    if (selected.length === 0) return;
    state.pushHistory();
    const selectedIds = new Set(selected.map((n) => n.id));
    const newNodes = state.nodes.map((n) =>
      selectedIds.has(n.id) ? { ...n, zIndex: (n.zIndex ?? 0) + 1 } : n
    );
    set({ nodes: newNodes });
    saveToStorage(newNodes, state.edges);
  },

  sendBackward: () => {
    const state = get();
    const selected = state.nodes.filter((n) => n.selected);
    if (selected.length === 0) return;
    state.pushHistory();
    const selectedIds = new Set(selected.map((n) => n.id));
    const newNodes = state.nodes.map((n) =>
      selectedIds.has(n.id) ? { ...n, zIndex: (n.zIndex ?? 0) - 1 } : n
    );
    set({ nodes: newNodes });
    saveToStorage(newNodes, state.edges);
  },

  exportDiagramFile: () => {
    const state = get();
    if (state.nodes.length === 0) return;
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      nodes: state.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
        style: n.style,
        zIndex: n.zIndex,
      })),
      edges: state.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: e.type,
        animated: e.animated,
        style: e.style,
        markerEnd: e.markerEnd,
      })),
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `diagram-${Date.now()}.diagram.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  },

  loadDiagramData: (data) => {
    const state = get();
    state.pushHistory();
    const nodes = (data.nodes || []) as DiagramNode[];
    const edges = (data.edges || []) as DiagramEdge[];
    set({ nodes, edges, selectedNodeIds: [] });
    saveToStorage(nodes, edges);
  },

  importDiagramFile: () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.diagram.json,.diagram,.txt";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          const parsed = JSON.parse(text);
          if (parsed.nodes && Array.isArray(parsed.nodes)) {
            get().loadDiagramData(parsed);
          }
        } catch {
          // invalid file
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },
}));
