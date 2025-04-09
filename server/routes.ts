import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

// Schema validation for form submission
const formSubmissionSchema = z.object({
  formId: z.string().uuid(),
  data: z.record(z.any())
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Add application routes here with /api prefix
  
  // Proxy route for GraphQL API
  app.post('/api/graphql', async (req, res) => {
    try {
      const response = await fetch('https://delicate-herring-66.hasura.app/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('GraphQL proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch data from GraphQL API' });
    }
  });

  // Submit form data
  app.post('/api/form-submissions', async (req, res) => {
    try {
      const validatedData = formSubmissionSchema.parse(req.body);
      
      // Here you would typically save the submission to your database
      // For now, we'll just return success
      
      res.status(201).json({ 
        success: true, 
        message: 'Form submitted successfully',
        data: validatedData
      });
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors
        });
      }
      
      res.status(500).json({ error: 'Failed to submit form' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
