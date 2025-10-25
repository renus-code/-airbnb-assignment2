// Import core modules and dependencies
const express = require("express"); // Import the Express framework to build the web application
const path = require("path"); // Node.js module for handling and transforming file paths
const { engine } = require("express-handlebars"); // Import the Handlebars template engine integration for Express
const fs = require("fs"); // Node.js module for file system operations
const { body, validationResult } = require("express-validator"); // Import functions for validating and sanitizing user input

// Initialize the Express application
const app = express();

// Define the port number for the server (use environment variable if available, otherwise default to 3000)
const port = process.env.PORT || 3000;

// ---------------------------- MIDDLEWARE SETUP ----------------------------

// Serve static files (like CSS, JS, images) from the "public" directory
// This allows files inside "public" to be accessible via the browser (e.g., /stylesheets/style.css)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })); // Load and parse the Airbnb JSON data file

let myData = fs.readFileSync(
  path.join(__dirname, "airbnb_data_code", "airbnb_with_photos.json")
);
let airbnb_json = JSON.parse(myData);

// ---------------------------- VIEW ENGINE SETUP ----------------------------

// Configure Handlebars as the template engine for rendering dynamic HTML pages
// The engine is registered with ".hbs" as the file extension

// ---------------------------- VIEW ENGINE SETUP ----------------------------

// app.engine(".hbs", engine({ extname: ".hbs" }));

app.engine(
  ".hbs",
  engine({
    extname: ".hbs",

    // Custom helpers
    helpers: {
      // Helper 1: Format service fee (convert empty → 0)
      formatServiceFee: function (fee) {
        if (!fee || fee.trim() === "") {
          return "0";
        }
        return fee;
      },

      // Helper 2 (optional): Highlight row if service fee is empty
      highlightIfEmpty: function (fee) {
        if (!fee || fee.trim() === "") {
          return "background-color:#ffe8e8; font-weight:bold;";
        }
        return "";
      },
    },
  })
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Tell Express to use Handlebars as the view engine
app.set("view engine", "hbs");

// Define the directory where all view (template) files are stored
app.set("views", path.join(__dirname, "views"));

// ---------------------------- ROUTE HANDLERS ----------------------------

// Route for the homepage (GET request to "/")
// Renders the "index.hbs" view file and passes a title variable to be displayed dynamically
// app.get("/", (req, res) => {
//   res.render("index", { title: "Express Handlebars Example" });
// });

// Route for "/users" path
// Sends a simple plain text response back to the client
app.get("/users", (req, res) => {
  res.send("Respond with a resource");
});

// ------------------- ASSIGNMENT - 1 ------------------

// Route: Home page
app.get("/", (req, res) => {
  res.render("index", { title: "Airbnb Data Viewer" });
});

// Route: Display first 20 listings data
app.get("/allData", (req, res) => {
  // Take only the first 20 listings for faster rendering
  const limitedData = airbnb_json.slice(0, 20);

  // Render the page with limited data
  res.render("allData", {
    title: "First 20 Airbnb Listings",
    listings: limitedData,
  });
});

// Route: displays resume
app.get("/about", (req, res) => {
  res.render("resume", { title: "About Me" });
});

// Route: Display one invoice/property by ID
app.get("/allData/invoiceID/:index", (req, res) => {
  const record = airbnb_json[req.params.index];
  res.render("id_search_result", { title: "Property Detail", record });
});

// Route: Search form (GET)
app.get("/search/invoiceID", (req, res) => {
  res.render("search_id_form", { title: "Search by Invoice ID" });
});

// Route: Handle search form submission (POST) with validation
app.post(
  "/search/invoiceID",
  [
    body("property_id")
      .notEmpty()
      .withMessage("Property ID is required")
      .isNumeric()
      .withMessage("Property ID must be a number")
      .trim()
      .escape(),
  ],
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("search_id_form", {
        title: "Search by Invoice ID",
        errors: errors.array(),
      });
    }

    const id = req.body.property_id;
    const record = airbnb_json.find((item) => item.id === id);

    if (!record) {
      return res.render("id_search_result", {
        title: "Search Result",
        message: "No property found with that ID",
      });
    }

    res.render("id_search_result", {
      title: "Search Result",
      record,
    });
  }
);

// ------------------- SEARCH BY NAME (PARTIAL MATCH) ------------------

// Route: Render search form
app.get("/search/name", (req, res) => {
  res.render("search_name_form", { title: "Search by Property Name" });
});

// Route: Handle search query
app.post(
  "/search/name",
  [
    body("name")
      .notEmpty()
      .withMessage("Property name is required")
      .trim()
      .escape(),
  ],
  (req, res) => {
    const errors = validationResult(req);

    // If validation fails
    if (!errors.isEmpty()) {
      return res.render("search_name_form", {
        title: "Search by Property Name",
        errors: errors.array(),
      });
    }

    const searchName = req.body.name.trim().toLowerCase();

    // Perform case-insensitive partial match
    const matchedProperties = airbnb_json.filter(
      (item) => item.NAME && item.NAME.toLowerCase().includes(searchName)
    );

    // If no match
    if (matchedProperties.length === 0) {
      return res.render("search_name_result", {
        title: "Search Result",
        message: `No properties found containing "${req.body.name}"`,
      });
    }

    // Render matched results
    res.render("search_name_result", {
      title: "Search Results",
      matchedProperties,
      query: req.body.name,
    });
  }
);

// Route: View all data
app.get("/viewData", (req, res) => {
  res.render("viewData", {
    title: "All Airbnb Data",
    listings: airbnb_json, // Pass all listings to the view
  });
});

// Route: View all clean data
app.get("/viewData/clean/", (req, res) => {
  res.render("viewData_clean", {
    title: "All Airbnb Data(cleaned)",
    listings: airbnb_json, // Pass all listings to the view
  });
});

// -------------------FILTER BY PRICE RANGE ------------------

// Render the form (GET)
app.get("/viewData/price", (req, res) => {
  res.render("price_form", { title: "Search by Price Range" });
});

// Handle form submission (POST)
app.post(
  "/viewData/price",
  [
    body("minPrice")
      .notEmpty()
      .withMessage("Minimum price is required")
      .isNumeric()
      .withMessage("Minimum price must be a number")
      .trim()
      .escape(),
    body("maxPrice")
      .notEmpty()
      .withMessage("Maximum price is required")
      .isNumeric()
      .withMessage("Maximum price must be a number")
      .trim()
      .escape(),
  ],
  (req, res) => {
    const errors = validationResult(req);

    // Validation errors
    if (!errors.isEmpty()) {
      return res.render("price_form", {
        title: "Search by Price Range",
        errors: errors.array(),
      });
    }

    const min = parseFloat(req.body.minPrice);
    const max = parseFloat(req.body.maxPrice);

    // Filter matching listings
    const filteredListings = airbnb_json.filter((item) => {
      // Remove '$' and spaces, convert to number
      const price = parseFloat(item.price.replace("$", "").trim());
      return price >= min && price <= max;
    });

    if (filteredListings.length === 0) {
      return res.render("price_result", {
        title: "Search Result",
        message: `No listings found between $${min} and $${max}`,
      });
    }

    // Render result view
    res.render("price_result", {
      title: `Listings between $${min} and $${max}`,
      listings: filteredListings,
    });
  }
);

// Catch-all route for any undefined URLs (handles 404 errors)
// Renders the "error.hbs" view with a status code of 404 and custom error message
app.all(/.*/, (req, res) => {
  res.status(404).render("error", {
    title: "Error",
    message: "Wrong Route",
  });
});

// ---------------------------- SERVER STARTUP ----------------------------

// Start the server and listen for incoming requests on the specified port
// Logs a message to the console indicating the server is running
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
