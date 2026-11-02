'use client';

import { create } from 'zustand';
import type { Ticket, TicketInput } from '@/types';

interface UiState {
  /** global "new / edit ticket" dialog, rendered once by the app shell */
  ticketDialog: { open: boolean; ticket: Ticket | null; defaults: TicketInput };
  openNewTicket: (defaults?: TicketInput) => void;
  openEditTicket: (ticket: Ticket) => void;
  closeTicketDialog: () => void;

  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;

  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  hydrateSidebar: () => void;
}

export const useUi = create<UiState>((set, get) => ({
  ticketDialog: { open: false, ticket: null, defaults: {} },
  openNewTicket: (defaults = {}) => set({ ticketDialog: { open: true, ticket: null, defaults } }),
  openEditTicket: (ticket) => set({ ticketDialog: { open: true, ticket, defaults: {} } }),
  closeTicketDialog: () => set((s) => ({ ticketDialog: { ...s.ticketDialog, open: false } })),

  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),

  sidebarCollapsed: false,
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    set({ sidebarCollapsed: next });
    try {
      localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
    } catch {}
  },
  hydrateSidebar: () => {
    try {
      set({ sidebarCollapsed: localStorage.getItem('sidebar-collapsed') === '1' });
    } catch {}
  },
}));
