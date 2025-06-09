import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotEnv from 'dotenv';
dotEnv.config();
import cookieParser from 'cookie-parser';
import { prisma } from './utils/prisma';
import { generateToken } from './utils/generateToken';
import { isAuthenticated } from './middleware/isAuthenticated';

const app = express();
const PORT = 4000;

app.use(express.json());

interface LoginRequestBody {
  signInTokn: string;
}


app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

export interface DecodedToken {
    email: string;
    name: string;
    avatar: string;
  }

  const router = express.Router();

  router.post(
    '/login',
    async (req: Request<{}, {}, LoginRequestBody>, res: Response, next: NextFunction):Promise<any> => {
      try {
        const { signInTokn } = req.body || {};

        
        if (!req.body || !req.body.signInTokn) {
          return res.status(400).json({ message: 'signInTokn is required', success: false, });
        }
  
        const decoded = jwt.verify(signInTokn, process.env.API_SECRET!) as DecodedToken;

        if (!decoded) {
          return res.status(401).json({ message: 'Invalid or expired token',   success: false, });
        }
         
      const  user= await prisma.user.findUnique({
          where: { email: decoded.email },
        });
  
        if (user) {
            const token = generateToken(user);          
          return res.status(200).json({
            message: 'User already exists',
            accessToken: token,
            success: true,
          });
        }
  
        const newUser = await prisma.user.create({
          data: {
            email: decoded.email,
            name: decoded.name,
            avatar: decoded.avatar,
          },
        });
      const token = generateToken(newUser);
        return res.status(200).json({
          message: 'User created successfully',
          accessToken: token,
          success: true,
        });
      } catch (error: any) {
        console.error('Login Error:', error.message || error);
  
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: 'Invalid or expired token', success: false });
        }
  
        return res.status(500).json({ message: 'Internal Server Error', success: false });
      }
    }
  );

  router.post(
    '/get-courses',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction):Promise<any> => {
      try {

        console.log("req",req.body)
       const pageNumber = req.body.pageNumber || 1;
       const pageSize = req.body.pageSize || 2;

       const skip = (pageNumber - 1) * pageSize;

       const courses = await prisma.course.findMany({
        take: pageSize,
        skip,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          reviews: true,
          courseData:{
            include:{
              links:true
            }
          },
          prerequisites:true,
          benefits:true,      
       
        }
       })

       const totalCourses = await prisma.course.count();
       const hasNextpage = skip + pageSize < totalCourses ? pageNumber + 1 : null;
       return res.status(200).json({
        success: true,
        courses,
        totalCourses,
        hasNextpage,
        current_page:pageNumber,
       })
        
      }catch(error){
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Internal Server Error', success: false });
      }
    }
  )

  router.get(
    '/get-user',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction):Promise<any> => {
   
      try {
        const user = (req as any).user;

        if (!user) {
          return res.status(401).json({ message: 'User not authenticated', success: false });
        }

        return res.status(200).json({
          success: true,
          user,
        });
        
      } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Internal Server Error', success: false });
        
      }
      
    }
  )




  app.use('/api', router);


app.listen(PORT, () => {
  console.log("Server is running on port 4000");
});