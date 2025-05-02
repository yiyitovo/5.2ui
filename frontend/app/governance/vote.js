// app/governance/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// 示例提案数据，实际项目中需要从 MakerDAO 的治理 API 或 Subgraph 获取数据
const sampleProposals = [
  { id: 1, title: 'Proposal 1', description: 'Increase collateralization ratio', votes: 100 },
  { id: 2, title: 'Proposal 2', description: 'Reduce stability fee', votes: 150 },
];

export default function GovernancePage() {
  const [proposals, setProposals] = useState([]);
  const [account, setAccount] = useState(null);

  // 页面加载时获取提案数据
  useEffect(() => {
    // 此处应调用真实接口获取提案数据
    setProposals(sampleProposals);
  }, []);

  // 钱包连接函数
  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('请安装 MetaMask 或其他以太坊钱包！');
    }
  }

  // 投票处理函数（示例，仅作演示用）
  async function handleVote(proposalId, voteChoice) {
    // voteChoice: true 表示支持，false 表示反对
    if (!window.ethereum) {
      alert('请安装 MetaMask 或其他以太坊钱包！');
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // 这里应使用真实的治理合约地址和ABI
    // const governanceContract = new ethers.Contract(contractAddress, contractABI, signer);

    try {
      // 示例：调用治理合约的 vote 方法
      // const tx = await governanceContract.vote(proposalId, voteChoice);
      // await tx.wait();

      alert(`已成功对提案 ${proposalId} 投票：${voteChoice ? '支持' : '反对'}`);
    } catch (err) {
      console.error(err);
      alert('投票失败，请重试！');
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>MakerDAO 治理投票</h1>
      {!account ? (
        <button onClick={connectWallet}>连接钱包</button>
      ) : (
        <p>已连接钱包：{account}</p>
      )}

      <h2>提案列表</h2>
      {proposals.length === 0 ? (
        <p>加载中...</p>
      ) : (
        <ul>
          {proposals.map((proposal) => (
            <li key={proposal.id} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
              <h3>{proposal.title}</h3>
              <p>{proposal.description}</p>
              <p>当前票数：{proposal.votes}</p>
              <div>
                <button onClick={() => handleVote(proposal.id, true)} style={{ marginRight: '10px' }}>
                  支持
                </button>
                <button onClick={() => handleVote(proposal.id, false)}>反对</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
