var mysql = require('mysql');
const bcrypt = require('bcrypt');

var con


function connectDatabase() {
    con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "root",
        database: "sharedatadb"
    });

    con.connect(function(err) {
        if (err){
            console.error(err);
            return;
        }
        console.log("Connected!");
    });
}

async function insertNewMember(firstName, lastName, email, password) {
    const fullName = firstName + " " + lastName;

    console.log(hashPassword);
    const sql = "INSERT INTO member (Name, Email, Password) VALUES (?, ?, ?)"

    try {
        const hashedPassword = await hashPassword(password);
        con.query(sql, [fullName, email, hashedPassword],
            (err, result) => {
                if (err) {
                    console.error("Error while inserting member: ", err);
                } else {
                    console.log("Successfully added member:", result);
                }
            }
        );
    } catch (error) {
        console.error("Error:", error);
    }
}

async function hashPassword(password) {
    const saltRounds = 10; // Number of hashing rounds; 10 is a good balance for security
    return await bcrypt.hash(password, saltRounds);
}

function checkDuplicate(table, column, value) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM ?? WHERE ?? = ?";
        con.query(sql, [table, column, value], (err, results) => {
            if (err) {
                console.error("Error checking for duplicates: ", err);
                return reject(err);
            }
            if (results.length > 0) {
                console.log("Duplicate found:", results);
                resolve({ isDuplicate: true, results: results });
            } else {
                console.log("No duplicate found");
                resolve(false);
            }
        });
    });
}

// In your database.js or where `getName` is defined
async function getName(table, email) {
    return new Promise((resolve, reject) => {
        const query = `SELECT Name FROM ${table} WHERE Email = ?`;

        con.query(query, [email], (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results[0]); // Assuming results is an array and Name is in the first object
        });
    });
}

async function verifyPassword(inputPassword, hashedPassword) {
    const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
    return isMatch;
}

async function insertStairGroup(houseName, groupName, principalAmount, handsReceived, totalHands, days, perHandAmount, handsDeducted, handsSent, maintenanceFee, startDate, email){

    const sql = "INSERT INTO share (Email, HouseName, FundCircle, Principle, Position, TotalPrinciple, TotalDay, Payment, Deduction, PaidInstallments, UnpaidInstallments, TotalPaidAmount, RemainingPayments, Profit, MaintenanceFee, StartDate, ReceiveDate, EndDate, isEnd) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"


    const UnpaidInstallments = totalHands - handsSent;
    const totalPaidAmount = handsSent * perHandAmount;
    const remainingPayments = perHandAmount * UnpaidInstallments;
    const profit = principalAmount - (perHandAmount * totalHands) - maintenanceFee;
    let ReceiveDate;
    // let startDate = new Date(startDate)
    let EndDate = new Date(startDate)
    let Today = new Date();
    let isEnd = false;

    // startDate = startDate.toISOString().split('T')[0]

    // console.log(profit)
    ReceiveDate = calculateReceiveDate(days, totalHands, handsReceived, startDate)
    // console.log("ReceiveDate is :",ReceiveDate)
    EndDate = calculateEndDate(days, totalHands, startDate)
    // console.log("EndDate is :",EndDate)

    Today = Today.toISOString().split('T')[0]

    if(Today > EndDate){
        isEnd = true;
    }



    try{
        con.query(sql, [email, houseName, groupName, principalAmount, handsReceived, totalHands, days, perHandAmount, handsDeducted, handsSent, UnpaidInstallments, totalPaidAmount,remainingPayments,  profit, maintenanceFee, startDate, ReceiveDate, EndDate, isEnd],
            (err, result) => {
                if (err) {
                    console.error("Error while inserting share: ", err);
                } else {
                    console.log("Successfully added share:", result);
                }
            }
        );
    }
    catch (error){
        console.error(error);
    }

}

function calculateReceiveDate(days, totalHands, handsReceived, startDate) {
    let ReceiveDate = new Date(startDate);
    if(days > totalHands){
        // console.log(days/totalHands);
        ReceiveDate.setDate(ReceiveDate.getDate()+(days/totalHands*handsReceived -(days/totalHands)))
        // ReceiveDate = ReceiveDate.toISOString().split('T')[0]
        // console.log(ReceiveDate)
    }
    else{

        // console.log(totalHands/days*handsReceived)
        ReceiveDate.setDate(ReceiveDate.getDate()+(totalHands/days*handsReceived -(totalHands/days)))
        // console.log(ReceiveDate)
    }
    ReceiveDate = ReceiveDate.toISOString().split('T')[0]

    return ReceiveDate
}

function calculateEndDate(days, totalHands, startDate){
    let EndDate = new Date(startDate);
    if(days > totalHands){
        // console.log(days/totalHands);
        EndDate.setDate(EndDate.getDate()+(days/totalHands*totalHands -(days/totalHands)))
        // ReceiveDate = ReceiveDate.toISOString().split('T')[0]
        // console.log(ReceiveDate)
    }
    else{

        // console.log(totalHands/days*handsReceived)
        EndDate.setDate(EndDate.getDate()+(totalHands/days*totalHands -(totalHands/days)))
        // console.log(ReceiveDate)
    }
    EndDate = EndDate.toISOString().split('T')[0]

    return EndDate
}

function getShareStairIfPayToday(Email){

    return new Promise((resolve, reject) =>{
        // const query = "SELECT DISTINCT HouseName FROM share WHERE EMAIL = ? AND isEnd = false"

        const query = "SELECT *,\n" +
            "    CASE\n" +
            "        WHEN TotalPrinciple < TotalDay\n" +
            "            THEN DATE_ADD(StartDate, INTERVAL ((TotalDay / TotalPrinciple) * PaidInstallments - 1) DAY)\n" +
            "        ELSE DATE_ADD(StartDate, INTERVAL ((TotalPrinciple / TotalDay) * PaidInstallments + 1) DAY)\n" +
            "    END AS CalculatedDate\n" +
            "FROM share\n" +
            "WHERE Email = 'kanisornkhetkhuean@gmail.com' AND isEnd = false\n" +
            "HAVING CalculatedDate = CURRENT_DATE()+1;"
        con.query(query, [Email], (err, results) =>{
            if(err){
                console.log("Error while query Get Share Stair")
                return reject(err)
            }
            // const formattedResults = results.map(result => {
            //     return {
            //         ...result,
            //         StartDate: result.StartDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
            //         ReceiveDate: result.ReceiveDate.toISOString().split('T')[0],
            //         EndDate: result.EndDate.toISOString().split('T')[0]
            //     };
            // });

            // console.log("Formatted Share results:", formattedResults);
            // resolve(formattedResults); // Resolve with formatted results
            resolve(results)
        })

    })

}



module.exports = { connectDatabase, insertNewMember, checkDuplicate, verifyPassword, getName, insertStairGroup, getShareStairIfPayToday};