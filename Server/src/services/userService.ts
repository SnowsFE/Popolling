import { users, User, getNextUserId } from "../models/user";
import bcrypt from "bcryptjs";

export const findUserByUsername = (username: string) =>
  users.find((u) => u.username === username);

export const addUser = async (
  username: string,
  password: string
): Promise<User> => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user: User = { id: getNextUserId(), username, passwordHash: hash };
  users.push(user);
  return user;
};

export const verifyPassword = async (
  user: User,
  password: string
): Promise<boolean> => {
  return bcrypt.compare(password, user.passwordHash);
};
