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

})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})