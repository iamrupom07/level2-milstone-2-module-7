import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { Pool, Result } from "pg";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();
const port = 5000;

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(20) NOT NULL,
      email VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(20) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      age INT,

      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
     )
    `);

    console.log("Table created successfully");
  } catch (error) {
    console.log(error);
  }
};

initDB();

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Hello World!",
    author: "Rupom",
  });
});

app.post("/api/users", async (req: Request, res: Response) => {
  const { name, email, password, age } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users(name,email,password,age) VALUES($1,$2,$3,$4)
    RETURNING *
    `,

      [name, email, password, age],
    );
    console.log(result);

    res.status(201).json({
      message: "User Created Successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
});

app.get("/api/users", async (req: Request, res: Response) => {
  try {
    const result: Result = await pool.query(`SELECT * FROM users`);
    res.status(200).json({
      success: true,
      message: "Users Fetched Successfully",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
});

app.get("/api/users/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const result: Result = await pool.query(`SELECT * FROM users WHERE id=$1`, [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }
    res.status(200).json({
      success: true,
      message: "User Fetched Successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
});

app.put("/api/users/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const { name, password, age, is_active } = req.body;

  try {
    const result: Result = await pool.query(
      `UPDATE users SET name=$1,password=$2,age=$3,is_active=$4 WHERE id=$5 RETURNING *`,
      [name, password, age, is_active, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }
    res.status(200).json({
      success: true,
      message: "User Updated Successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
