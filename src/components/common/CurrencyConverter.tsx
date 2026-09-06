import { useEffect, useState } from 'react';
import { Alert, Select, Spin, Typography } from 'antd';
import { convertCurrency, getSupportedCurrencies } from '@/services/currencyService';
import { getErrorMessage } from '@/utils/errors';
import type { ExchangeRate } from '@/types/currency';

const BASE_CURRENCY = 'JPY';
const DEFAULT_TARGET_CURRENCY = 'USD';

interface CurrencyConverterProps {
  amountJPY: number;
}

/** Estimated equivalent of a JPY amount in another currency, via Frankfurter.app. Informational only. */
export function CurrencyConverter({ amountJPY }: CurrencyConverterProps) {
  const [currencies, setCurrencies] = useState<Record<string, string>>({});
  const [target, setTarget] = useState(DEFAULT_TARGET_CURRENCY);
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSupportedCurrencies()
      .then(setCurrencies)
      .catch(() => setCurrencies({}));
  }, []);

  useEffect(() => {
    if (target === BASE_CURRENCY) {
      setRate(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    convertCurrency(BASE_CURRENCY, target, amountJPY)
      .then((result) => {
        if (!cancelled) setRate(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Currency conversion is currently unavailable.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [target, amountJPY]);

  const currencyOptions = [
    { value: 'JPY', label: 'JPY — Japanese Yen (original)' },
    ...Object.entries(currencies)
      .filter(([code]) => code !== 'JPY')
      .map(([code, name]) => ({ value: code, label: `${code} — ${name}` })),
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        View in your currency
      </Typography.Text>
      <div style={{ marginTop: 4 }}>
        <Select
          size="small"
          style={{ width: 260 }}
          value={target}
          onChange={setTarget}
          options={currencyOptions}
          loading={Object.keys(currencies).length === 0}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        {target === BASE_CURRENCY && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Showing the original tour currency.
          </Typography.Text>
        )}
        {target !== BASE_CURRENCY && loading && <Spin size="small" />}
        {target !== BASE_CURRENCY && !loading && error && <Alert type="error" showIcon message={error} />}
        {target !== BASE_CURRENCY && !loading && !error && rate && (
          <>
            <Typography.Text strong>
              ≈ {rate.convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} {rate.to}
            </Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Exchange rate: 1 {rate.from} = {rate.rate} {rate.to} (as of {rate.date})
              — estimate only, final charge is in JPY.
            </Typography.Text>
          </>
        )}
      </div>
    </div>
  );
}
