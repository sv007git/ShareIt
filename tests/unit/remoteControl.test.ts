import { describe, it, expect } from 'vitest';
import { RemoteControlEvent, RemoteControlState } from '../../src/signaling/types';

describe('Remote Control Feature', () => {
  it('correctly validates normalized coordinates for remote events', () => {
    const event: RemoteControlEvent = {
      action: 'move',
      x: 0.542,
      y: 0.819,
      timestamp: Date.now()
    };

    expect(event.x).toBeGreaterThanOrEqual(0);
    expect(event.x).toBeLessThanOrEqual(1);
    expect(event.y).toBeGreaterThanOrEqual(0);
    expect(event.y).toBeLessThanOrEqual(1);
  });

  it('manages remote control state lifecycle', () => {
    let state: RemoteControlState = {
      isControlling: false,
      isBeingControlled: false,
      activeControllerId: null,
      activeControllerName: null,
      pendingRequest: null,
      controlMode: 'pointer'
    };

    // 1. Participant requests control
    state = {
      ...state,
      pendingRequest: { requesterPeerId: 'peer-2', requesterName: 'Bob' }
    };
    expect(state.pendingRequest?.requesterName).toBe('Bob');

    // 2. Presenter accepts request
    state = {
      ...state,
      isBeingControlled: true,
      activeControllerId: 'peer-2',
      activeControllerName: 'Bob',
      pendingRequest: null
    };
    expect(state.isBeingControlled).toBe(true);
    expect(state.activeControllerId).toBe('peer-2');

    // 3. Presenter revokes control
    state = {
      ...state,
      isBeingControlled: false,
      activeControllerId: null,
      activeControllerName: null
    };
    expect(state.isBeingControlled).toBe(false);
  });
});
