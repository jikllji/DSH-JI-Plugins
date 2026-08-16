/**
 * JI-Theme — host half.
 *
 * The host side is intentionally a no-op loader entry: the whole feature
 * lives in the browser half (`./client`), which dsh's client-modules picks up
 * through this package's `dsh.client` declaration — the same shape as the
 * shipped ui-* packages. Skin choice, custom themes, and wallpaper are
 * persisted in localStorage (a third-party settings namespace would answer
 * `settings-not-exposed` on the host settings wire, which only serves an
 * allowlisted set of namespaces to browser clients).
 */

/** Host loader entry for the browser implementation exported from `./client`. */
export function apply() {}
