import jwt from 'jsonwebtoken';
import dontEnv from 'dotenv';
dontEnv.config(); // Load environment variables from .en

export const generateToken = (user: any) => {
    const payload = {
      email: user.email,
      name: user.name,
      id: user.id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET_ACCESSTOKEN as string, {
      expiresIn: '30d',
    });
    return token;
  };