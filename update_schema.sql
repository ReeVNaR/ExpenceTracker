-- Run this in your Supabase SQL Editor to add the payment_method column

alter table transactions 
add column payment_method text check (payment_method in ('cash', 'online')) default 'online';
