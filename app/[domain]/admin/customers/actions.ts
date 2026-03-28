"use server";

import { getCustomers } from "@/app/actions/user";
import { getAccountCreatedUsers } from "@/app/actions/user";

export async function fetchCustomers() {
  return getCustomers();
}

export async function fetchAccountCreatedUsers() {
  return getAccountCreatedUsers();
}
