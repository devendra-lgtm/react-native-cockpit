import { CockpitTab, ConsoleLog, NetworkRequest } from '../types';

type Listener = () => void;

class CockpitStore {
  private requests: NetworkRequest[] = [];
  private logs: ConsoleLog[] = [];
  private listeners: Set<Listener> = new Set();
  private maxRequests: number = 100;
  private maxLogs: number = 200;

  public isModalVisible: boolean = false;
  public activeTab: CockpitTab = 'network';
  public selectedRequest: NetworkRequest | null = null;
  public errorCount: number = 0;

  public setLimits(maxRequests?: number, maxLogs?: number) {
    if (maxRequests) this.maxRequests = maxRequests;
    if (maxLogs) this.maxLogs = maxLogs;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public getRequests(): NetworkRequest[] {
    return this.requests;
  }

  public getLogs(): ConsoleLog[] {
    return this.logs;
  }

  public addRequest(request: NetworkRequest) {
    this.requests = [request, ...this.requests].slice(0, this.maxRequests);
    this.notify();
  }

  public updateRequest(id: string, updates: Partial<NetworkRequest>) {
    let found = false;
    this.requests = this.requests.map((req) => {
      if (req.id === id) {
        found = true;
        const updated = { ...req, ...updates };
        // Check if error status
        if (
          updates.status &&
          (updates.status >= 400 || updates.status === 0) &&
          (!req.status || req.status < 400)
        ) {
          this.errorCount += 1;
        }
        if (updates.error && !req.error) {
          this.errorCount += 1;
        }
        // If this is currently selected, update it
        if (this.selectedRequest?.id === id) {
          this.selectedRequest = updated;
        }
        return updated;
      }
      return req;
    });

    if (found) {
      this.notify();
    }
  }

  public clearRequests() {
    this.requests = [];
    if (this.selectedRequest) {
      this.selectedRequest = null;
    }
    this.recalculateErrors();
    this.notify();
  }

  public addLog(log: ConsoleLog) {
    if (log.level === 'error') {
      this.errorCount += 1;
    }
    this.logs = [log, ...this.logs].slice(0, this.maxLogs);
    this.notify();
  }

  public clearLogs() {
    this.logs = [];
    this.recalculateErrors();
    this.notify();
  }

  public resetErrorCount() {
    this.errorCount = 0;
    this.notify();
  }

  private recalculateErrors() {
    const netErrors = this.requests.filter(
      (r) => (r.status && r.status >= 400) || r.error
    ).length;
    const logErrors = this.logs.filter((l) => l.level === 'error').length;
    this.errorCount = netErrors + logErrors;
  }

  public setModalVisible(visible: boolean) {
    this.isModalVisible = visible;
    if (visible) {
      this.resetErrorCount();
    }
    this.notify();
  }

  public setActiveTab(tab: CockpitTab) {
    this.activeTab = tab;
    this.notify();
  }

  public setSelectedRequest(request: NetworkRequest | null) {
    this.selectedRequest = request;
    this.notify();
  }
}

export const cockpitStore = new CockpitStore();
