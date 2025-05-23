const {Schema , model} = require("mongoose");
const { createHmac , randomBytes} = require("crypto");
const {createTokenForUser} = require("../authentication/auth")
const userSchema = new Schema({
    fullName : {
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
    },
    role:{
        type: String,
        enum: ["vendor" , "explorer"],
        default: "explorer"
    },
    salt:{
        type : String, 
    }
 } , {timestamps: true}
)

userSchema.pre('save' , function (next){
    const user = this;

    if(!user.isModified("password")) return;
    
    const salt = randomBytes(16).toString();
    const hashedPassword = createHmac("sha256" , salt)
                        .update(user.password)
                        .digest("hex");
    this.salt = salt;
    this.password =  hashedPassword; 
      
    next();
})



userSchema.static("matchPasswordAndGenerateToken" , async function (email , password, role) {
    
    const user = await this.findOne({email});
    
    if (!user) throw new Error("USER NOT FOUND");

    const salt = user.salt;
    const hashedPassword = user.password;
    const userRole = user.role

    const userProvidedHash = createHmac("sha256" , salt)
                            .update(password)
                            .digest("hex");

     if(hashedPassword !== userProvidedHash || role !== userRole )  throw new Error("Incorrect Credentials");

                               
    const token =  createTokenForUser(user);
    
    return token;
})


const userModel =  model("user" ,userSchema);
module.exports= userModel;
