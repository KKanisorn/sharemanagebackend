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




module.exports = { connectDatabase, insertNewMember, checkDuplicate, verifyPassword, getName};