const express = require('express')
const app = express()
const connectDB = require('./DB/db')
const cors = require('cors');
const mqttRun = require('./util/mqtt');
const mobileRoutes = require('./routes/mobileRoutes')
app.use(cors());
let temperatureArray = [2];
app.use(express.json());
connectDB()
mqttRun()
app.use('/api/auth', require('./routes/auth.routes'));

app.use('/api', mobileRoutes )

port = process.env.PORT || 4000

app.listen(port, ()=>{
    console.log(`App listening on port ${port}`)
})