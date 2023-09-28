export interface GitStatsElectronAPI {
  checkRepoExists: (repo: string) => Promise<void>,
}
export interface LoginAPI {
  tryLogin: (token: string) => Promise<boolean>
}

declare global {
  interface Window {
    gitstats: GitStatsElectronAPI,
    login: LoginAPI
  }
}