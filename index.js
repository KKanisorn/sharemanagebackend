const express = require('express')
const app = express()
const cors = require('cors');
const port = 5000

const { connectDatabase, insertNewMember, checkDuplicate, verifyPassword } = require('./database');

app.use(cors());
app.use(express.json());

connectDatabase();

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/login', async (req, res) => {
    const {emailOrUsername, password} = req.body

    console.log("Login Info Received: ", emailOrUsername, password)

    try {
        const { isDuplicate, results } = await checkDuplicate("member", "Email", emailOrUsername)
        if (isDuplicate) {
            if(verifyPassword(password, results[0]["Password"])) {
                res.status(200).json({message: "Login Successful"})
            }
            else{
                res.status(200).json({message: "Login Failed"})
            }
        }else{
            res.status(200).json({message: "Login Failed"})
        }
    } catch (e) {
        console.error("Error checkDuplicate: ", e)
    }


})

app.post('/register', async (req, res) => {
    const {firstName, lastName, email, password, repassword} = req.body
    console.log("Register Info Received: ", firstName, lastName, email, password, repassword)

    try {
        const isDuplicate = await checkDuplicate("member", "Email", email)
        console.log("Duplicate is: ",isDuplicate)
        if (!isDuplicate) {
            insertNewMember(firstName, lastName, email, password)
            res.status(200).json({message: "Register Successful"})
            console.log("Register Successful")
        } else {
            res.status(200).json({message: "Login Failed Duplicated Email"})
        }
    }catch (e){
        console.error("Error checkDuplicate: ", e)
    }


})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})