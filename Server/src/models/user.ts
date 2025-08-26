export interface User {
  id: number;
  username: string;
  passwordHash: string;
}

export const users: User[] = [];
let userSeq = 1;

export const getNextUserId = () => userSeq++;
