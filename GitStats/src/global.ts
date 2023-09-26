export interface GitStatsElectronAPI {
  checkRepoExists: (repo: string) => Promise<void>,
}
export interface LoginAPI {
  tryLogin: (token: string) => Promise<void>
}

declare global {
  interface Window {
    gitstats: GitStatsElectronAPI,
    login: LoginAPI
  }
}