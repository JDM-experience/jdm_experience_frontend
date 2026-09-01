import { useEffect, useState } from 'react';
import { Alert, Select, Spin, Typography } from 'antd';
import { getExchangeRate, getSupportedCurrencies } from '@/services/currencyService';
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
    getExchangeRate(BASE_CURRENCY, target)
      .then((result) => {
        if (!cancelled) setRate(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load the exchange rate.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [target]);

  const currencyOptions = [
    { value: 'JPY', label: 'JPY — Japanese Yen (original)' },
    ...Object.entries(currencies)
      .filter(([code]) => code !== 'JPY')
      .map(([code, name]) => ({ value: code, label: `${code} — ${name}` })),
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Estimated equivalent
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
              {(amountJPY * rate.rate).toLocaleString('en-US', { maximumFractionDigits: 2 })} {rate.target}
            </Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Exchange rate: 1 {rate.base} = {rate.rate} {rate.target} (as of {rate.date})
              — estimate only, final charge is in JPY.
            </Typography.Text>
          </>
        )}
      </div>
    </div>
  );
}
