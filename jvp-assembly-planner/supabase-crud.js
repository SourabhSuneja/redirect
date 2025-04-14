import {
   createClient
} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ckltcwampaagyzneaznt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbHRjd2FtcGFhZ3l6bmVhem50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MDI2NjgsImV4cCI6MjA0ODA3ODY2OH0.pUT2kngS0nkzFBjI-P6g8azU5E3tZzGDQGL68-AUWFc';
const supabase = createClient(supabaseUrl, supabaseKey);

window.userId = null;
window.userDetails = null;
const redirectURL = null;

// check authentication status
async function checkAuth() {
   try {
      const {
         data: {
            session
         }
      } = await supabase.auth.getSession();

      if (session && session.user) {
         // User is signed in, fetch the user data
         window.userId = session.user.id;

         // Wait for fetchUserData to resolve or reject
         // window.userDetails = await fetchUserData(userId, 'students');

         // authentication successful
         return true;

      } else {
         // User is not signed in
         return false;
      }
   } catch (error) {
      // User is registered but user details are missing
      return false;
   }
}

// sign in user
async function signInUser(email, password) {
   try {
      const {
         data,
         error
      } = await supabase.auth.signInWithPassword({
         email: email,
         password: password
      });

      if (error) {
         console.error("Error signing in:", error.message);
         throw error;
      }

      console.log("User signed in successfully.");
      return data; // Contains user session and user information
   } catch (err) {
      console.error("Unexpected error during sign-in:", err.message);
      throw err;
   }
}

// sign out user
async function signOutUser() {
   try {
      const {
         error
      } = await supabase.auth.signOut();

      if (error) {
         console.error("Error logging out:", error.message);
         throw error;
      }

      console.log("User logged out successfully.");
   } catch (err) {
      console.error("Unexpected error during logout:", err.message);
      throw err;
   }
}

// sign up a new user
async function signUpUser(email, password) {
   try {
      const {
         data,
         error
      } = await supabase.auth.signUp({
         email: email,
         password: password
      });

      if (error) {
         console.error("Error signing up:", error.message);
         throw error;
      }

      console.log("User signed up successfully:", data);
      return data; // Contains user information and any session details
   } catch (err) {
      console.error("Unexpected error during sign-up:", err.message);
      throw err;
   }
}

// change user account password
async function changeUserPassword(newPassword) {
   try {
      // Check if the user is authenticated
      const {
         data: user,
         error: userError
      } = await supabase.auth.getUser();
      if (userError) {
         console.error("Error fetching user:", userError.message);
         throw userError;
      }

      // Update the user's password
      const {
         error
      } = await supabase.auth.updateUser({
         password: newPassword
      });
      if (error) {
         console.error("Error updating password:", error.message);
         throw error;
      }

      console.log("Password changed successfully.");
      return true;
   } catch (err) {
      console.error("Error changing password:", err.message);
      throw err;
   }
}

// insert data
async function insertData(tableName, data) {
   try {
      const {
         data: insertedData,
         error
      } = await supabase
         .from(tableName)
         .insert(data)
         .select();

      if (error) throw error;
      return insertedData;
   } catch (error) {
      console.error("Error inserting data:", error.message);
      return null;
   }
}

// upsert data
async function upsertData(tableName, data, conflictColumns = []) {
   try {
      const {
         data: upsertedData,
         error
      } = await supabase
         .from(tableName)
         .upsert(data, {
            onConflict: conflictColumns
         })
         .select();

      if (error) throw error;
      return upsertedData;
   } catch (error) {
      console.error("Error upserting data:", error.message);
      return null;
   }
}

// select data
async function selectData(
   tableName,
   fetchSingle = false,
   columns = "*",
   matchColumns = [],
   matchValues = [],
   orderByColumn = null,
   orderDirection = "asc",
   customFilters = []
) {
   try {
      let query = supabase.from(tableName).select(columns);

      // Apply exact match filters
      if (matchColumns.length > 0 && matchValues.length > 0) {
         if (matchColumns.length !== matchValues.length) {
            throw new Error("matchColumns and matchValues arrays must have the same length.");
         }
         const matchConditions = {};
         for (let i = 0; i < matchColumns.length; i++) {
            matchConditions[matchColumns[i]] = matchValues[i];
         }
         query = query.match(matchConditions);
      }

      // Apply custom filters (e.g., gte, lte, etc.)
      for (const filter of customFilters) {
         if (filter.operator === "gte") query = query.gte(filter.column, filter.value);
         else if (filter.operator === "lte") query = query.lte(filter.column, filter.value);
         else if (filter.operator === "eq") query = query.eq(filter.column, filter.value);
         else if (filter.operator === "lt") query = query.lt(filter.column, filter.value);
         else if (filter.operator === "gt") query = query.gt(filter.column, filter.value);
         // Add more operators if needed
      }

      // Apply sorting
      if (orderByColumn) {
         query = query.order(orderByColumn, {
            ascending: orderDirection.toLowerCase() === "asc"
         });
      }

      const {
         data,
         error
      } = fetchSingle ? await query.single() : await query;

      if (error) throw error;
      return data;
   } catch (error) {
      console.error("Error fetching data:", error.message);
      return null;
   }
}

// delete data
async function deleteRow(
   tableName,
   matchColumns = [],
   matchValues = []
) {
   try {
      // Validate input lengths
      if (matchColumns.length !== matchValues.length) {
         throw new Error("matchColumns and matchValues arrays must have the same length.");
      }

      // Create the match object
      const matchData = {};
      for (let i = 0; i < matchColumns.length; i++) {
         matchData[matchColumns[i]] = matchValues[i];
      }

      // Perform the delete with filters
      const {
         data,
         error
      } = await supabase
         .from(tableName)
         .delete()
         .match(matchData)
         .select();

      if (error) throw error;
      return data;
   } catch (error) {
      console.error("Error deleting rows:", error.message);
      return null;
   }
}

// update data
async function updateRow(
   tableName,
   matchColumns = [],
   matchValues = [],
   updateColumns = [],
   updateValues = []
) {
   try {
      // Validate input lengths
      if (matchColumns.length !== matchValues.length) {
         throw new Error("matchColumns and matchValues arrays must have the same length.");
      }
      if (updateColumns.length !== updateValues.length) {
         throw new Error("updateColumns and updateValues arrays must have the same length.");
      }

      // Create the update object
      const updateData = {};
      for (let i = 0; i < updateColumns.length; i++) {
         updateData[updateColumns[i]] = updateValues[i];
      }

      // Create the match object
      const matchData = {};
      for (let i = 0; i < matchColumns.length; i++) {
         matchData[matchColumns[i]] = matchValues[i];
      }

      // Perform the update with filters
      const {
         data,
         error
      } = await supabase
         .from(tableName)
         .update(updateData)
         .match(matchData)
         .select();

      if (error) throw error;
      return data;
   } catch (error) {
      console.error("Error updating rows:", error.message);
      return null;
   }
}

// invoke a function 
async function invokeFunction(functionName, functionArgs = {}, fetchSingle = false) {
   try {
      // Invoke the PostgreSQL function using Supabase's rpc method
      const {
         data,
         error
      } = await supabase.rpc(functionName, functionArgs);

      if (error) throw error;

      // If fetchSingle is true, return the first row only
      return fetchSingle ? data?.[0] || null : data;
   } catch (error) {
      console.error(`Error invoking function ${functionName}:`, error.message);
      return null;
   }
}

// subscribe to a webhook on table
async function subscribeToTable(tableName, callback) {
   try {
      // Ensure the Supabase client is initialized
      if (!supabase) throw new Error("Supabase client is not initialized.");

      // Subscribe to changes on the specified table
      const subscription = supabase
         .channel(`table-changes-${tableName}`) // Create a unique channel name
         .on(
            'postgres_changes', {
               event: '*',
               schema: 'public',
               table: tableName
            }, // Listen to all events on the table
            (payload) => {
               callback(payload);
            }
         )
         .subscribe();

      return subscription;
   } catch (error) {
      console.error("Error subscribing to table changes:", error.message);
      return null;
   }
}

// expose all methods globally by attaching them to the window object
window.checkAuth = checkAuth;
window.signInUser = signInUser;
window.signOutUser = signOutUser;
window.signUpUser = signUpUser;
window.changeUserPassword = changeUserPassword;
window.insertData = insertData;
window.upsertData = upsertData;
window.selectData = selectData;
window.deleteRow = deleteRow;
window.updateRow = updateRow;
window.invokeFunction = invokeFunction;
window.subscribeToTable = subscribeToTable;