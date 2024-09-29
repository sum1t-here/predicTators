use anchor_lang::prelude::*;
use anchor_spl::token::{ Token, Transfer };

declare_id!("4DmLyB448d8BMxVDbPEoJhyD9BpPE12BS5wTMTTq3zYB");

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

        // Transfer the bet amount
        let cpi_accounts = anchor_spl::token::Transfer {
            from: bettor.to_account_info(),
            to: market.to_account_info(),
            authority: bettor.to_account_info(),
        };
        anchor_spl::token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            amount
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
    #[account(init, payer = user, space = 8 + 64 + 64 + 16 + 16 + 1)]
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
    pub token_program: Program<'info, anchor_spl::token::Token>,
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
    pub event_name: String, // Name of the event being predicted (rain or not)
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
}
