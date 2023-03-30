import express from 'express'
import mongoose from 'mongoose'
import UsersModel, { UserModel } from '../models/userSchema'
import { genPassword, validatePass, issueJWT } from '../utils/authUtils'
import { userInfo } from 'os'

//###CURRENTLY EVERY AUTHORIZATION REQUEST SENDS ALL USER INFO INCLUDING PHOTO 
export const authorizeUser = async (req: any, res: any) => {
    console.log('protected access')
    //sending ALLL user info with auth request, should be changed ###TEMP#####
    res.status(200).json({success: true, user: req.user})
}
// export const fetchUserInfo = async(req: any, res: any) => {
//     UserModel.findOne({username: req.body.username})
// }


export const loginUser = async (req: any, res: any, next: any) => {
    //Checks if user exists in DB first
    UserModel.findOne({username : req.body.username})
        .then((user : any) => {
            if(!user) {
                return res.status(401).json({success: false, msg: "Could not find user" + req.body.username})
            }
            const isValid =  validatePass(req.body.password, user.hash, user.salt)
            if(isValid) {
                const signedJWT = issueJWT(user)
                res.status(200).json({ success: true, token: signedJWT.token, expiresIn: signedJWT.expires });
            }else{
                res.status(401).json({success: false, msg: 'You entered the wrong password'})
            }
        }).catch((err)=> {next(err)})
}


export const registerUser = async (req: any, res: any) => {
    try {
        if(req.body.password === '') throw "No Password";
        const saltHash = genPassword(req.body.password);
        const {salt, hash} = saltHash
    //Creating new Mongo User Information
        const newUser = new UsersModel({
            username: req.body.username,
            email: req.body.email,
            profileImg: req.body.profileImg,
            hash: hash,
            salt: salt,
         });
        const user = await newUser.save()
        res.status(200).json({success: true, user: user})
    } catch (error) {
        res.status(406).json({success: false, msg: error})
    }
}

export const updateUser = async (req: any, res: any) => {
    const updatedUser = req.body;
    const ID = req.user._id         
    await UserModel.findByIdAndUpdate({_id: ID}, {firstName : updatedUser.firstName, lastName : updatedUser.lastName, email: updatedUser.email,
                                        username: updatedUser.username, profileImg: updatedUser.profileImg, 
                                        baseLocation: {location: updatedUser.baseLocation.location, lng: updatedUser.baseLocation.lng, lat: updatedUser.baseLocation.lat}})
        .then(()=>{res.status(200).json({success: 'true'})})
        .catch((err)=> {res.status(401).json({success: 'false', error: err})})
}


export const fetchAllUsers = async (req: any, res: any) => {
    const allUsers = await UserModel.find()
    
    res.status(200).json({allUsers})
}