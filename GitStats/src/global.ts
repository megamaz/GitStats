export interface GitStatsElectronAPI {
  checkRepoExists: (repo:string) => Promise<void>,
}

declare global {
  interface Window {
    gitstats: GitStatsElectronAPI
  }
}