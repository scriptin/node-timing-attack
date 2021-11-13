# Are timing attack on regular string comparison in Node.js web applications practical?

> TL;DR: **NO, not practical.**

Inspired by [Cracking passwords using ONLY response times](https://youtu.be/XThL0LP3RjY) video
by [mCoding](https://www.youtube.com/channel/UCaiL2GDNpLYH6Wokkk1VNcg).

The scenario:

- There is a web application (written in Node.js, but this applies to any language) which implements some kind of API,
  which uses a key to restrict access to some of its parts.
- The key is stored as plain text, the app compares it with a key provided via an HTTP header (it could be a part of a
  request body, this is not important). This is a bad security practice in general, but in this case imagine the key is
  kept secret. For example, it can be only used by another server-side application, and not leaked to end users.
- The keys are compared as strings, using the `===` operator, which supposedly works like this (
  see [lib/compare.js](lib/compare.js) for an example "slow" implementation):
    1. First, the lengths of strings are compared
    2. If lengths match, the first characters are compared,
    3. If the first characters match, the second are compared,
    4. ... and so on, until all characters match => the strings are equal
    5. Otherwise, the strings are not equal.
- There is no request rate limit, or any other mechanism which would prevent an attacker from brute-forcing the app.

In this scenario, theoretically, a [timing attack](https://en.wikipedia.org/wiki/Timing_attack) is possible to crack the
key. In practice, however, time delays produces by string comparison are negligible compared to the delays caused by
network and other sources:

> Note that we did not include any string comparison operations in our research. This was intentional, since previous researchers have made it clear that measuring these remotely is almost certainly impractical in the vast majority of cases.

[Web Timing Attacks Made Practical (Morgan & Morgan, 2015)][1]

There are studies examining the limits of such attacks:

> _At what empirical resolution can an attacker time a remote host?_ The resolution an attacker can time a remote host depends on how many measurements they can collect. Our simulated attacker using statistical hypothesis testing was able to reliably distinguish a processing time differences as low as 200ns and 30µs with 1,000 measurements on the LAN and WAN respectively with.

[Opportunities and Limits of Remote Timing Attacks (Crosby et al., 2009)][2]

In this particular setup, I wasn't able to achieve the accuracy of 200ns because I haven't used the clock calibration
method described in this paper. However, the limit of 30µs in a real scenario (not localhost, but over the Internet)
makes even such advanced timing mechanism impractical for performing a timing attack of string comparison. (See
benchmarking results at the end.)

## Timing attack on a "slow" string comparison

1. Generate a key: `npm run keygen` (Only works in *nix shells: Linux, Mac OS X. For Windows, manually create `key.txt`
   with a key 1-32 chars long, containing only latin alphanumeric characters: numbers, upper/lowercase letters)
2. Run a server: `npm run server:unsafe`
3. Crack key length: `npm run crack:length` - this will print lines like `8 was the slowest X time(s)` repeatedly - the
   number `8` in this case is the most likely length. Algorithm is probabilistic, it does multiple passes to collect the
   data to account for systematic changes in round trip times of HTTP requests
4. Crack the key itself: `npm run crack:key 8` (`8` is the key length from a previous step) - this will eventually guess
   the key

### Why it works?

"Slow" string comparison uses a special `sleep` method b/w operations - see [lib/compare.js](lib/compare.js), and this
slows down each operation enough so that each additional comparison step adds significant delay, which is noticeable
when comparing round trip times of requests.

## Timing attack on a normal string comparison

The steps are the same, except step #2: `npm run server:safe` (instead of `unsafe`)

You will see that step #3 gives random guesses to the key length, none of which are correct. Even if you start step #4
with a correct length, it will infinitely produce wrong guesses.

### Why doesn't it work?

Run the benchmark:

```
$ npm run benchmark

> node-timing-attack@1.0.0 benchmark /home/dmitry/projects/node-timing-attack
> node benchmark.js

String comparison:            1453ns
Slow string comparison:     942453ns
HTTP request:               593552ns
```

Artificially slowed down string comparison works in a similar time compared to HTTP requests in this specific setup, so
even most simple statistical method would be sufficient to perform this kind of attack.

Normal string comparison operation is 2 orders of magnitude faster than a network request, even on localhost, in the app
which only checks the key. In a real world scenario, the difference would be 3 or more orders of magnitude. This makes
it impossible to perform any timing attack.

This is in agreement with [[Crosby, 2009][2]]: string comparison produces delays of only about 1000-2000ns, which is
much lower than 30µs threshold described in the paper.

## When do timing attacks work?

Timing attacks are possible when a target operation is slow enough compared to the noise (network, other operations).
[[Morgan, 2015][2]] gives a following list of examples (times measured for examples written in Python 3.4):

| Task                  | Approx. Execution Time (ns) |
| :-------------------- | --------------------------: |
| MD5 of an 8 byte string                     |  6150 |
| Parse trivial JSON string                   | 13700 |
| Parse moderately complex JSON string        | 29300 |
| Parse a 2 parameter HTTP query string       | 42900 |
| SQLite memory SELECT                        | 27800 |
| SQLite on-disk SELECT                       | 45500 |
| Open and read (but not close) a 1 byte file | 83000 |

## Limitations of this research

Benchmarking methods I've used are based on `process.hrtime()` method in Node.js v14. The algorithm of running the
benchmarks does not account for all important factors, but it is sufficient for a simple demonstration.

There are more sophisticated time measurement techniques which would potentially allow me to crack the key even when
using a normal string comparison, but only in this specific localhost setup using a very simple web application. In any
real world scenario even these techniques wouldn't help.

[1]: https://www.blackhat.com/docs/us-15/materials/us-15-Morgan-Web-Timing-Attacks-Made-Practical-wp.pdf

[2]: https://www.cs.rice.edu/~dwallach/pub/crosby-timing2009.pdf
