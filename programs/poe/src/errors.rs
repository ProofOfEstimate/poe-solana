use anchor_lang::prelude::*;

#[error_code]
pub enum CustomErrorCode {
    #[msg("Poll has already started.")]
    PollAlreadyStarted,

    #[msg("Poll is closed.")]
    PollClosed,

    #[msg("Poll has not been resolved.")]
    PollNotResolved,

    #[msg("Poll has already been resolved.")]
    PollAlreadyResolved,
}
