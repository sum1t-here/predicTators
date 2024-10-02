use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount, Transfer };

declare_id!("4DmLyB448d8BMxVDbPEoJhyD9BpPE12BS5wTMTTq3zYB");

const EVENT_NAME_MAX_LEN: usize = 64; // Set max length for event name
const LOCATION_MAX_LEN: usize = 64; // Set max length for location

#[program]
pub mod smart_contract {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        event_name: String,
        location: String,
        end_time: i64
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.event_name = event_name;
        market.location = location;
        market.end_time = end_time;
        market.yes_bets = 0;
        market.no_bets = 0;
        market.resolved = false;
        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, prediction: bool, amount: u64) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let bettor = &mut ctx.accounts.bettor;

        // Ensure valid bet amount
        require!(amount > 0, CustomError::InvalidBetAmount);

        // Transfer the bet amount (SOL transfer)
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &bettor.key(),
            &market.key(),
            amount
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                bettor.to_account_info(),
                market.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ]
        )?;

        // Update bet totals
        if prediction {
            market.yes_bets += amount;
        } else {
            market.no_bets += amount;
        }

        Ok(())
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, outcome: bool) -> Result<()> {
        let market = &mut ctx.accounts.market;

        // Ensure the event has not already been resolved
        require!(!market.resolved, CustomError::MarketAlreadyResolved);
        // Ensure the event has ended
        require!(Clock::get()?.unix_timestamp > market.end_time, CustomError::MarketStillOpen);

        // Payout logic
        if outcome {
            market.yes_payout = market.no_bets;
        } else {
            market.no_payout = market.yes_bets;
        }

        market.resolved = true;
        Ok(())
    }
}

// Context for initializing the prediction market
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 4 + EVENT_NAME_MAX_LEN + 4 + LOCATION_MAX_LEN + 8 + 8 + 8 + 8 + 8 + 1
    )]
    pub market: Account<'info, PredictionMarket>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Context for placing a bet
#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub market: Account<'info, PredictionMarket>,
    #[account(mut)]
    pub bettor: Signer<'info>,
    pub system_program: Program<'info, System>, // Add system program
}

// Context for resolving the market
#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, PredictionMarket>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

// Data structure representing the market
#[account]
pub struct PredictionMarket {
    pub event_name: String, // Name of the event being predicted
    pub location: String, // The location for prediction
    pub end_time: i64, // Unix timestamp for the event's end
    pub yes_bets: u64, // Total amount bet for "yes"
    pub no_bets: u64, // Total amount bet for "no"
    pub resolved: bool, // Whether the prediction event is resolved
    pub yes_payout: u64, // Total payout for "yes"
    pub no_payout: u64, // Total payout for "no"
}

// Custom errors
#[error_code]
pub enum CustomError {
    #[msg("The market has already been resolved.")]
    MarketAlreadyResolved,
    #[msg("The market is still open for betting.")]
    MarketStillOpen,
    #[msg("You cannot place a bet with an invalid amount.")]
    InvalidBetAmount,
}
