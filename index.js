const express = require('express')
const app = express()
const cors = require('cors');
const port = 5000

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/login', (req, res) => {
    const { emailOrUsername, password} = req.body

    console.log("Login Info Received: ", emailOrUsername, password)

    if(emailOrUsername && password) {
        res.status(200).json({message:"Login Successful"})
    }else{
        res.status(200).json({message:"Login Failed"})
    }
})

app.post('/register', (req, res) => {
    const { firstName, lastName, email, password, repassword } = req.body
    console.log("Register Info Received: ", firstName, lastName, email, password, repassword)

    if(firstName && lastName && email && password && repassword){
        res.status(200).json({message:"Register Successful"})
        console.log("Register Successful")
    }else{
        res.status(200).json({message:"Login Failed"})
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})