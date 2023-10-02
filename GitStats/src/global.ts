export interface GitStatsElectronAPI {
  CheckRepoExists: (repo: string) => Promise<boolean>,
  SaveRepo: (repo: string) => Promise<void>
}
export interface LoginAPI {
  TryLogin: (token: string) => Promise<boolean>
}

declare global {
  interface Window {
    gitstats: GitStatsElectronAPI,
    login: LoginAPI
  }
}