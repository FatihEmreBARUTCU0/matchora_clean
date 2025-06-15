const jwt=require("jsonwebtoken")
const { isBlacklisted } = require("../utils/blacklist");

const verifyToken=(req,res,next)=>{
    
    const authHeader=req.headers.authorization  //header alıyoruz

    if(!authHeader || !authHeader.startsWith("Bearer ")){    //token doğrulama
        return res.status(401).json({message:"Token Bulunamadı"})
}

    const token=authHeader.split(" ")[1]  //tokeni aldık

    if(isBlacklisted(token)){
       return res.status(401).json({ message: "Geçersiz token (logout sonrası)" })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

    
            req.user = { id: decoded.id };    
        next()
    
    } catch(err){
        return res.status(401).json({message:"Geçersiz token"})
    }
}
    
module.exports=verifyToken