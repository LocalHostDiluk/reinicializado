import dotenv from "dotenv";

dotenv.config();

interface JWTConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  managerTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  managerTokenExpiry: string;
}

export const jwtConfig: JWTConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  managerTokenSecret: process.env.JWT_MANAGER_SECRET,

  accessTokenExpiry: "15m",
  refreshTokenExpiry: "7d",
  managerTokenExpiry: "5m",
} as const;
