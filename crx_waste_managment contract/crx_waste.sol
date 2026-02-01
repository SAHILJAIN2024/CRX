// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CRX_WASTE_exchange is ERC1155, Ownable {
    using Counters for Counters.Counter;

    enum TokenType { Unknown, Request, Commit }

    Counters.Counter private _requestCounter;
    Counters.Counter private _commitCounter;

    mapping(uint256 => TokenType) public tokenTypes;
    mapping(uint256 => string) public tokenURIs;

    event RequestMinted(
        address indexed to,
        uint256 indexed tokenId,
        string uri
    );

    event CommitMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 indexed requestId,
        string uri
    );

    mapping(address => uint256[]) public userRequest;
    mapping(uint256 => uint256[]) public repoCommits;

    constructor(address initialOwner)
        ERC1155("")
        Ownable(initialOwner)
    {}

    /* ---------------- REQUEST ---------------- */

    function mintRequest(
        address to,
        string memory repoUri
    ) external returns (uint256) {
        _requestCounter.increment();
        uint256 tokenId = 1000 + _requestCounter.current();

        _mint(to, tokenId, 1, "");
        tokenTypes[tokenId] = TokenType.Request;
        tokenURIs[tokenId] = repoUri;
        userRequest[to].push(tokenId);

        emit RequestMinted(to, tokenId, repoUri);
        return tokenId;
    }

    /* ---------------- COMMIT ---------------- */

    // ✅ ANYONE can mint a commit to ANY valid request
    function mintCommit(
        address to,
        uint256 requestId,
        string memory commitUri
    ) external returns (uint256) {
        require(
            tokenTypes[requestId] == TokenType.Request,
            "Invalid requestId"
        );

        _commitCounter.increment();
        uint256 tokenId = 2000 + _commitCounter.current();

        _mint(to, tokenId, 1, "");
        tokenTypes[tokenId] = TokenType.Commit;
        tokenURIs[tokenId] = commitUri;

        userRequest[to].push(tokenId);
        repoCommits[requestId].push(tokenId);

        emit CommitMinted(to, tokenId, requestId, commitUri);
        return tokenId;
    }

    function uri(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        return tokenURIs[tokenId];
    }
}
