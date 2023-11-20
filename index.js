// Whenever you visit a country add it using this app.
// extra option from me : you can delete them all
// as a pracise on Database module with node, express, ejs

import express from "express";
import bodyParser   from "body-parser";
import pg from "pg"; // postgreSQL DB 

const app = express();
const port = 3000;

// create a db client
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "osama2023", // local data base 
  port: 5432,
});

db.connect();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

let countries = []; // define array

// function to check visited countries
async function checkVisitedCountries(){
  const result = await db.query("SELECT country_code FROM visited_countries");    
  result.rows.forEach((country) => {
  countries.push(country.country_code);});  
  console.log("countries arrays length>>>"+countries.length);
  console.log(result.rows);
  return countries;
}

// GET home page
app.get("/", async (req, res) => { 
  console.log("root page called !"); 
  const countries = await checkVisitedCountries();
  res.render("index.ejs", { countries: countries, total: countries.length }); 
}); 

// most important end point
app.post("/add", async(req,res)=>{
  
  // get user Entry
  const countryName = (req.body.country).toLowerCase();
  console.log("country Name is:"+countryName);
  
  //send query to countries table asking for country_code by giving country_name even in small letter
  // using pipe symbol and wild car to facilitate to user choice of country 
  // example russia  or Russia FedralRepuplic
  const result =await db.query(
    "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
    [countryName])
  
  // country exist procceed, other wise go to else statement
  if(result.rowCount > 0 ){
    console.log(result.rows[0].country_code);
    const country_code = result.rows[0].country_code;
  
    // add country_code to your data base country_visited table ... insert command
    try {
        await db.query(`insert into visited_countries(country_code) values ($1)`,[country_code]);
        res.redirect("/"); // inserted OK, go back to root page 
        } catch (Error) {
          // error means duplicate key
          if(Error.message.includes("duplicate key value violates unique constraint")){
            // console.log("country already added, please try again");
            res.render("index.ejs", { countries: countries, total: countries.length,
              error: "country already added, Please tray again !"});
          }
          }       
  } else {
      res.render("index.ejs", { countries: countries, total: countries.length,
        error: "no country found"});
      }   
});

// delete all countries route
app.post("/delete", async(req,res)=>{ 
    console.log("Calling for delete....");
    // delete all row field in visited country table
    const result = await db.query("DELETE FROM visited_countries")
    console.log("result for delete below>>>");
    console.log("delete result row count>>>" + result.rowCount);  
    countries = []; // empty the array    
    res.redirect("/") // go to root page
})


// start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
