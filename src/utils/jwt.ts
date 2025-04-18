import  jwt  from "jsonwebtoken";

export const generateJWT =(id:string)=>{
    const token = jwt.sign({id},process.env.JWT_PASS,{
        expiresIn:'30d'
    })
    return token
}